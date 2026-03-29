import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  const checks: Record<string, unknown> = {
    env_database_url: process.env.DATABASE_URL ? 'set (hidden)' : 'MISSING',
    env_session_secret: process.env.SESSION_SECRET ? 'set (hidden)' : 'MISSING',
    env_node_env: process.env.NODE_ENV,
  }

  try {
    const userCount = await prisma.user.count()
    checks.db_connection = 'OK'
    checks.db_user_count = userCount
  } catch (e: unknown) {
    checks.db_connection = 'FAILED'
    checks.db_error = e instanceof Error ? e.message : String(e)
  }

  return NextResponse.json(checks, { status: checks.db_connection === 'OK' ? 200 : 500 })
}
