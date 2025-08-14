import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'

const JP2_BASE = process.env.SL_JP2_BASE_URL || 'https://journeyplanner.integration.sl.se/v2'

function toJp2Coord(lon: number, lat: number) {
  return `${lon}:${lat}:WGS84[dd.ddddd]`
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const lat = Number(searchParams.get('lat'))
  const lon = Number(searchParams.get('lon'))
  const limit = Number(searchParams.get('limit') || 5)
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return NextResponse.json({ error: 'lat and lon required' }, { status: 400 })
  }
  const url = `${JP2_BASE}/stop-finder`
  // Search by coordinates and limit to stops
  const params: Record<string, any> = {
    name_sf: toJp2Coord(lon, lat),
    type_sf: 'coord',
    any_obj_filter_sf: 2, // stops only
  }
  const { data } = await axios.get(url, { params, timeout: 15000 })
  const locations = (data?.locations ?? data?.stopFinder?.locations ?? []) as any[]
  const normalized = locations.map((loc) => {
    let outLat: number | undefined
    let outLon: number | undefined
    if (Array.isArray(loc.coord) && loc.coord.length >= 2) {
      const a = Number(loc.coord[0])
      const b = Number(loc.coord[1])
      const looksLikeLatFirst = a >= 55 && a <= 70 && b >= 10 && b <= 25
      const looksLikeLonFirst = a >= 10 && a <= 25 && b >= 55 && b <= 70
      if (looksLikeLatFirst) { outLat = a; outLon = b } else if (looksLikeLonFirst) { outLon = a; outLat = b } else { outLat = a; outLon = b }
    } else if (loc.coord?.y != null && loc.coord?.x != null) {
      outLat = Number(loc.coord.y)
      outLon = Number(loc.coord.x)
    } else if (loc.latitude != null && loc.longitude != null) {
      outLat = Number(loc.latitude)
      outLon = Number(loc.longitude)
    }
    return {
      id: String(loc.id ?? loc.stopId ?? loc.extId ?? loc.extIdStr ?? `${loc.type}:${loc.name}`),
      name: String(loc.disassembledName ?? loc.name ?? ''),
      fullName: String(loc.name ?? loc.disassembledName ?? ''),
      type: String(loc.type ?? 'unknown').toLowerCase(),
      latitude: Number.isFinite(outLat) ? outLat : undefined,
      longitude: Number.isFinite(outLon) ? outLon : undefined,
      matchQuality: loc.matchQuality ?? undefined,
    }
  })
  const filtered = normalized.filter((n) => n.latitude != null && n.longitude != null)
  return NextResponse.json({ results: filtered.slice(0, limit) })
}
