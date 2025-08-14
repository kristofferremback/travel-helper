import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = params
  const body = await req.json()
  const { label, description, address, latitude, longitude } = body
  
  const updated = await prisma.address.update({
    where: { id, userId: session.user?.id },
    data: { label, description, address, latitude, longitude },
  })
  return NextResponse.json({ address: updated })
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = params
  await prisma.address.delete({ where: { id, userId: session.user?.id } })
  return NextResponse.json({ ok: true })
}
