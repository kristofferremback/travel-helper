import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'

const JP2_BASE = process.env.SL_JP2_BASE_URL || 'https://journeyplanner.integration.sl.se/v2'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q')?.trim() || ''
  const limit = Number(searchParams.get('limit') || 10)
  if (!q) return NextResponse.json({ results: [] })

  // Use SL Journey Planner v2 stop-finder to return stops AND addresses (and POIs)
  const url = `${JP2_BASE}/stop-finder`
  const params: Record<string, any> = {
    name_sf: q,
    type_sf: 'any',
    any_obj_filter_sf: 46, // 2 (stops) + 12 (streets+addresses) + 32 (POI) = 46
  }
  const { data } = await axios.get(url, { params, timeout: 15000 })
  const locations = (data?.locations ?? data?.stopFinder?.locations ?? []) as any[]

  const normalized = locations.map((loc) => {
    // Coords might be in different shapes; normalize to lat/lon numbers
    let lat: number | undefined
    let lon: number | undefined
    if (Array.isArray(loc.coord) && loc.coord.length >= 2) {
      const a = Number(loc.coord[0])
      const b = Number(loc.coord[1])
      // Heuristic: Stockholm lat ~ [55,70], lon ~ [10,25]
      const looksLikeLatFirst = a >= 55 && a <= 70 && b >= 10 && b <= 25
      const looksLikeLonFirst = a >= 10 && a <= 25 && b >= 55 && b <= 70
      if (looksLikeLatFirst) {
        lat = a; lon = b
      } else if (looksLikeLonFirst) {
        lon = a; lat = b
      } else {
        // default to [lat, lon]
        lat = a; lon = b
      }
    } else if (loc.coord?.y != null && loc.coord?.x != null) {
      lat = Number(loc.coord.y)
      lon = Number(loc.coord.x)
    } else if (loc.latitude != null && loc.longitude != null) {
      lat = Number(loc.latitude)
      lon = Number(loc.longitude)
    }

    return {
      id: String(loc.id ?? loc.stopId ?? loc.extId ?? loc.extIdStr ?? `${loc.type}:${loc.name}`),
      name: String(loc.disassembledName ?? loc.name ?? ''),
      fullName: String(loc.name ?? loc.disassembledName ?? ''),
      type: String(loc.type ?? 'unknown').toLowerCase(),
      latitude: Number.isFinite(lat) ? lat : undefined,
      longitude: Number.isFinite(lon) ? lon : undefined,
      matchQuality: loc.matchQuality ?? undefined,
      isBest: loc.isBest ?? undefined,
      parent: loc.parent ? { id: loc.parent.id, name: loc.parent.name, type: loc.parent.type } : undefined,
    }
  })

  const filtered = normalized.filter((n) => n.name)
  const limited = filtered.slice(0, limit)
  return NextResponse.json({ results: limited })
}
