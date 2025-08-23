import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import { formatDateForAPI, formatTimeForAPI } from '@/utils/time'

const JP2_BASE = process.env.SL_JP2_BASE_URL || 'https://journeyplanner.integration.sl.se/v2'

function toJp2Coord(lon: number, lat: number) {
  return `${lon}:${lat}:WGS84[dd.ddddd]`
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const fromLat = Number(searchParams.get('fromLat'))
    const fromLon = Number(searchParams.get('fromLon'))
    const toLat = Number(searchParams.get('toLat'))
    const toLon = Number(searchParams.get('toLon'))
    const num = Math.min(Math.max(Number(searchParams.get('num') || 3), 1), 3)
    const when = searchParams.get('when') || undefined
    const arriveBy = searchParams.get('arriveBy') === 'true'

    if (!Number.isFinite(fromLat) || !Number.isFinite(fromLon) || !Number.isFinite(toLat) || !Number.isFinite(toLon)) {
      return NextResponse.json({ journeys: [] })
    }

    const url = `${JP2_BASE}/trips`
    const params: Record<string, any> = {
      type_origin: 'coord',
      name_origin: toJp2Coord(fromLon, fromLat),
      type_destination: 'coord',
      name_destination: toJp2Coord(toLon, toLat),
      calc_number_of_trips: num,
    }

    // Map time controls per local docs: use itd_date (YYYYMMDD), itd_time (HHMM), and itd_trip_date_time_dep_arr ('dep'|'arr')
    if (when) {
      const d = new Date(when)
      if (!Number.isNaN(d.getTime())) {
        params['itd_date'] = formatDateForAPI(d) // YYYYMMDD
        params['itd_time'] = formatTimeForAPI(d) // HHMM
      }
    }
    params['itd_trip_date_time_dep_arr'] = arriveBy ? 'arr' : 'dep'

    const { data } = await axios.get(url, { params, timeout: 15000 })
    const journeys = Array.isArray(data?.journeys) ? data.journeys : []

    const normalized = journeys.map((j: any, index: number) => ({
      slPreferredOrder: index,
      duration: j.tripRtDuration ?? j.tripDuration ?? null,
      legs: Array.isArray(j.legs)
        ? j.legs.map((l: any) => ({
            origin: {
              name: l?.origin?.parent?.disassembledName || l?.origin?.name,
              planned: l?.origin?.departureTimePlanned,
              estimated: l?.origin?.departureTimeEstimated,
            },
            destination: {
              name: l?.destination?.parent?.disassembledName || l?.destination?.name,
              planned: l?.destination?.arrivalTimePlanned,
              estimated: l?.destination?.arrivalTimeEstimated,
            },
            mode: l?.transportation?.product?.name || l?.transportation?.name || undefined,
            line: l?.transportation?.disassembledName || l?.transportation?.number || undefined,
          }))
        : [],
    }))

    return NextResponse.json({ journeys: normalized })
  } catch (e) {
    // Gracefully degrade
    return NextResponse.json({ journeys: [] })
  }
}
