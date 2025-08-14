import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'

const DEV_BASE = process.env.SL_DEVIATIONS_BASE_URL || 'https://deviations.integration.sl.se/v1'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const site = searchParams.getAll('site')
  const line = searchParams.getAll('line')
  const future = searchParams.get('future')

  const params: Record<string, any> = {}
  if (future != null) params.future = future === 'true'
  for (const s of site) params.site = [...(params.site ?? []), Number(s)]
  for (const l of line) params.line = [...(params.line ?? []), Number(l)]

  const url = `${DEV_BASE}/messages`
  const { data } = await axios.get(url, { params, timeout: 20000 })

  return NextResponse.json({ deviations: data?.messages ?? data })
}
