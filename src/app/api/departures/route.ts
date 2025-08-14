import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'

const TRANSPORT_BASE = process.env.SL_TRANSPORT_BASE_URL || 'https://transport.integration.sl.se/v1'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const siteId = searchParams.get('siteId')
  if (!siteId) return NextResponse.json({ error: 'siteId is required' }, { status: 400 })
  const url = `${TRANSPORT_BASE}/sites/${encodeURIComponent(siteId)}/departures`
  const { data } = await axios.get(url, { timeout: 15000 })
  return NextResponse.json({ departures: data?.departures ?? data })
}
