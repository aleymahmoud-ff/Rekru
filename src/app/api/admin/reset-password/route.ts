import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'

// TEMPORARY out-of-band password reset endpoint.
// Active ONLY while the RESET_TOKEN env var is set on the server. This file is
// removed (and the env var unset) immediately after a one-off reset.
export const dynamic = 'force-dynamic'

function tokenOk(provided: string | null): boolean {
  const expected = process.env.RESET_TOKEN
  if (!expected || !provided) return false
  const a = Buffer.from(provided)
  const b = Buffer.from(expected)
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

export async function POST(request: NextRequest) {
  // Disabled unless explicitly armed via env var.
  if (!process.env.RESET_TOKEN) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  if (!tokenOk(request.headers.get('x-reset-token'))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { email?: string; newPassword?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { email, newPassword } = body
  if (!email || !newPassword || newPassword.length < 8) {
    return NextResponse.json({ error: 'email and newPassword (>=8 chars) required' }, { status: 400 })
  }

  const users = await prisma.user.findMany({
    where: { email: { equals: email, mode: 'insensitive' } },
    select: { id: true, email: true, organization: { select: { slug: true } } },
  })

  if (users.length === 0) {
    return NextResponse.json({ error: 'No user with that email' }, { status: 404 })
  }
  if (users.length > 1) {
    return NextResponse.json(
      {
        error: 'Multiple users share that email; specify orgId',
        matches: users.map((u) => ({ email: u.email, orgSlug: u.organization.slug })),
      },
      { status: 409 }
    )
  }

  const passwordHash = await bcrypt.hash(newPassword, 12)
  await prisma.user.update({ where: { id: users[0].id }, data: { passwordHash } })

  return NextResponse.json({ success: true, email: users[0].email, orgSlug: users[0].organization.slug })
}
