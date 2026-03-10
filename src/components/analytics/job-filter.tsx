'use client'

import { useRouter } from 'next/navigation'

type Job = { id: string; title: string; status: string }

export function JobFilter({
  jobs,
  selectedJobId,
}: {
  jobs: Job[]
  selectedJobId?: string
}) {
  const router = useRouter()

  return (
    <select
      value={selectedJobId ?? ''}
      onChange={(e) => {
        const val = e.target.value
        router.push(val ? `/analytics?job=${val}` : '/analytics')
      }}
      className="rounded-lg border px-3 py-2 text-sm"
      style={{
        fontFamily: 'var(--font-body)',
        borderColor: '#e8e5e0',
        color: '#1a1a1a',
        backgroundColor: '#ffffff',
      }}
    >
      <option value="">All Jobs</option>
      {jobs.map((j) => (
        <option key={j.id} value={j.id}>
          {j.title}
          {j.status === 'closed' ? ' (Closed)' : ''}
        </option>
      ))}
    </select>
  )
}
