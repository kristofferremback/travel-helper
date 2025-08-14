import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'

const JP2_BASE = process.env.SL_JP2_BASE_URL || 'https://journeyplanner.integration.sl.se/v2'

type Coord = { lat: number; lon: number }

function toJp2Coord(c: Coord): string {
  // format: x:y:WGS84[dd.ddddd] where x=lon, y=lat
  return `${c.lon}:${c.lat}:WGS84[dd.ddddd]`
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const fromLat = Number(searchParams.get('fromLat'))
  const fromLon = Number(searchParams.get('fromLon'))
  const toLat = Number(searchParams.get('toLat'))
  const toLon = Number(searchParams.get('toLon'))
  const when = searchParams.get('when') // ISO string optional
  const arriveBy = /^(1|true|yes)$/i.test(String(searchParams.get('arriveBy') || ''))
  const num = Number(searchParams.get('num') || 3)

  if ([fromLat, fromLon, toLat, toLon].some((v) => Number.isNaN(v))) {
    return NextResponse.json({ error: 'Invalid coordinates' }, { status: 400 })
  }

  const params: Record<string, string | number | boolean> = {
    name_origin: toJp2Coord({ lat: fromLat, lon: fromLon }),
    type_origin: 'coord',
    name_destination: toJp2Coord({ lat: toLat, lon: toLon }),
    type_destination: 'coord',
    calc_number_of_trips: Math.min(Math.max(num, 1), 3),
    calc_one_direction: true,
  }
  if (when) {
    // Use SL API documented parameter names: itd_date (YYYYMMDD) and itd_time (HHMM)
    const t = String(when)
    const [datePart, timePartFull] = t.split('T')
    if (datePart && timePartFull) {
      const hhmm = timePartFull.slice(0, 5)
      // Convert YYYY-MM-DD to YYYYMMDD
      const yyyymmdd = datePart.replace(/-/g, '')
      // Convert HH:MM to HHMM
      const hhmm_nodash = hhmm.replace(':', '')
      
      params['itd_date'] = yyyymmdd
      params['itd_time'] = hhmm_nodash
      // Set departure vs arrival mode
      params['itd_trip_date_time_dep_arr'] = arriveBy ? 'arr' : 'dep'
    }
  }

  const url = `${JP2_BASE}/trips`
  const { data } = await axios.get(url, { params, timeout: 20000 })

  // Normalize the response to only what we need
  const journeys = (data?.journeys ?? []).map((j: any, index: number) => ({
    duration: j.tripRtDuration ?? j.tripDuration,
    slPreferredOrder: index, // Keep SL's original preferred order
    legs: (j.legs ?? []).map((l: any) => ({
      mode: l.transportation?.mode ?? l.transportation?.name ?? 'WALK',
      line: l.transportation?.line ?? null,
      origin: {
        name: l.origin?.name,
        lat: l.origin?.coord?.y ?? l.origin?.coord?.latitude,
        lon: l.origin?.coord?.x ?? l.origin?.coord?.longitude,
        planned: l.origin?.departureTimePlanned,
        estimated: l.origin?.departureTimeEstimated,
      },
      destination: {
        name: l.destination?.name,
        lat: l.destination?.coord?.y ?? l.destination?.coord?.latitude,
        lon: l.destination?.coord?.x ?? l.destination?.coord?.longitude,
        planned: l.destination?.arrivalTimePlanned,
        estimated: l.destination?.arrivalTimeEstimated,
      },
    })),
  }))

  // Sort by departure time, but preserve SL's preference for same departure times
  journeys.sort((a: any, b: any) => {
    const aDept = a.legs?.[0]?.origin?.estimated || a.legs?.[0]?.origin?.planned
    const bDept = b.legs?.[0]?.origin?.estimated || b.legs?.[0]?.origin?.planned
    
    if (aDept && bDept) {
      const aTime = new Date(aDept).getTime()
      const bTime = new Date(bDept).getTime()
      if (aTime !== bTime) return aTime - bTime
    }
    
    // If same departure time (or missing times), use SL's preferred order
    return a.slPreferredOrder - b.slPreferredOrder
  })

  return NextResponse.json({ journeys, debug: { sent: params } })
}
