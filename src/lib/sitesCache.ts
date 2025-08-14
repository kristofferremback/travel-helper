import lunr from 'lunr'
import { prisma } from './prisma'
import axios from 'axios'

export type SiteDoc = {
  id: number
  name: string
  type: string
  latitude: number
  longitude: number
  municipality?: string | null
  region?: string | null
}

type IndexDoc = SiteDoc & { _id: string }

let index: lunr.Index | null = null
let docs: Map<number, SiteDoc> = new Map()
let lastRefreshed = 0

const TRANSPORT_BASE = process.env.SL_TRANSPORT_BASE_URL || 'https://transport.integration.sl.se/v1'
const MIN_FETCH_INTERVAL = Number(process.env.SL_MIN_FETCH_INTERVAL_MS || 60000)

async function fetchAllSites(): Promise<SiteDoc[]> {
  // The SL Transport API exposes /sites which returns a list; we may need to paginate.
  // We'll attempt to fetch /sites and /stop-areas expansions defensively.
  const url = `${TRANSPORT_BASE}/sites`
  const { data } = await axios.get(url, { timeout: 20000 })
  // Normalize
  // Expect data.sites: Array<{ id, name, location: { latitude, longitude }, type, municipality, region }>
  const items = (data?.sites ?? []).map((s: any) => ({
    id: Number(s.id),
    name: String(s.name),
    type: String(s.type ?? 'SITE'),
    latitude: Number(s.location?.latitude ?? s.latitude),
    longitude: Number(s.location?.longitude ?? s.longitude),
    municipality: s.municipality ?? null,
    region: s.region ?? null,
  })) as SiteDoc[]
  return items
}

async function upsertSites(sites: SiteDoc[]) {
  if (!sites.length) return
  const chunks: SiteDoc[][] = []
  for (let i = 0; i < sites.length; i += 500) chunks.push(sites.slice(i, i + 500))
  for (const chunk of chunks) {
    await (prisma.site.createMany as any)({
      data: chunk.map((s) => ({
        id: s.id,
        name: s.name,
        type: s.type,
        latitude: s.latitude,
        longitude: s.longitude,
        municipality: s.municipality ?? undefined,
        region: s.region ?? undefined,
        raw: JSON.stringify(s),
      })),
      skipDuplicates: true,
    })
    // Update names/coords if changed
    await Promise.all(chunk.map((s) =>
      prisma.site.update({
        where: { id: s.id },
        data: {
          name: s.name,
          type: s.type,
          latitude: s.latitude,
          longitude: s.longitude,
          municipality: s.municipality ?? undefined,
          region: s.region ?? undefined,
        },
      }).catch(() => undefined)
    ))
  }
}

function buildIndex(all: SiteDoc[]) {
  docs = new Map(all.map((s) => [s.id, s]))
  const idx = lunr(function (this: any) {
    this.ref('_id')
    this.field('name', { boost: 10 })
    this.field('type')
    this.field('municipality')
    this.field('region')
    all.forEach((s) =>
      this.add({
        _id: String(s.id),
        name: s.name,
        type: s.type,
        municipality: s.municipality ?? '',
        region: s.region ?? '',
      } as IndexDoc)
    )
  })
  index = idx
}

export async function ensureSitesIndex(opts: { eager?: boolean } = {}) {
  const now = Date.now()
  if (index && now - lastRefreshed < MIN_FETCH_INTERVAL) return
  // eager: always refresh if older than interval; otherwise lazy
  const sitesFromDb = await prisma.site.findMany({ take: 1 })
  if (!sitesFromDb.length || opts.eager) {
    try {
      const sites = await fetchAllSites()
      await upsertSites(sites)
    } catch (e) {
      // ignore network errors; fall back to DB
    }
  }
  const all = await prisma.site.findMany({})
  buildIndex(
    all.map((s) => ({
      id: s.id,
      name: s.name,
      type: s.type,
      latitude: s.latitude,
      longitude: s.longitude,
      municipality: s.municipality,
      region: s.region,
    }))
  )
  lastRefreshed = now
}

export async function searchSites(query: string, limit = 10): Promise<SiteDoc[]> {
  if (!index) await ensureSitesIndex()
  if (!index) return []
  const results = index.search(query)
  const out: SiteDoc[] = []
  for (const r of results.slice(0, limit)) {
    const id = Number(r.ref)
    const doc = docs.get(id)
    if (doc) out.push(doc)
  }
  return out
}
