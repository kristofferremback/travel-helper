import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { z } from 'zod'

const PlaceSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('site'),
    id: z.string(),
    name: z.string(),
    latitude: z.number(),
    longitude: z.number(),
    type: z.string().optional(),
  }),
  z.object({
    kind: z.literal('address'),
    name: z.string(),
    address: z.string(),
    latitude: z.number(),
    longitude: z.number(),
  }),
])

const TripCreateSchema = z.object({
  label: z.string().optional(),
  fromPlace: PlaceSchema,
  toPlace: PlaceSchema,
  pinned: z.boolean().optional(),
  position: z.number().int().optional().nullable(),
})

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const trips = await prisma.trip.findMany({
    where: { userId: session.user.id },
    orderBy: [
      { pinned: 'desc' },
      { position: 'asc' },
      { createdAt: 'desc' },
    ],
  })
  return NextResponse.json({ trips })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = TripCreateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid body', details: parsed.error.flatten() }, { status: 400 })
  }

  const created = await prisma.trip.create({
    data: {
      userId: session.user.id,
      label: parsed.data.label,
      fromPlace: parsed.data.fromPlace,
      toPlace: parsed.data.toPlace,
      pinned: parsed.data.pinned ?? false,
      position: parsed.data.position ?? null,
    },
  })
  return NextResponse.json({ trip: created })
}
