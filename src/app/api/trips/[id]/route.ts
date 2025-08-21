import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { z } from 'zod'

const TripUpdateSchema = z.object({
  label: z.string().optional(),
  fromPlace: z.any().optional(),
  toPlace: z.any().optional(),
  pinned: z.boolean().optional(),
  position: z.number().int().optional().nullable(),
})

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = TripUpdateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid body', details: parsed.error.flatten() }, { status: 400 })
  }

  const updated = await prisma.trip.update({
    where: { id: params.id, userId: session.user.id },
    data: parsed.data,
  })
  return NextResponse.json({ trip: updated })
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await prisma.trip.delete({ where: { id: params.id, userId: session.user.id } })
  return NextResponse.json({ ok: true })
}
