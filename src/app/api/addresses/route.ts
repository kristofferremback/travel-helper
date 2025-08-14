import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  const addresses = await prisma.address.findMany({ 
    where: { userId: session.user?.id },
    orderBy: { createdAt: 'desc' } 
  })
  return NextResponse.json({ addresses })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { label, description, address, latitude, longitude } = body
  if (!label || !address || typeof latitude !== 'number' || typeof longitude !== 'number') {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }
  
  const created = await prisma.address.create({ 
    data: { 
      label, 
      description, 
      address, 
      latitude, 
      longitude,
      userId: session.user?.id
    } 
  })
  return NextResponse.json({ address: created })
}
