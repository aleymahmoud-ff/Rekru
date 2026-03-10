'use client'

import { Users, CheckCircle, XCircle, Clock, BarChart3, ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'

type Interview = {
  outcome: string
  stage: { name: string }
}

type JobCandidate = {
  status: string
  currentStage: { name: string } | null
  interviews: Interview[]
}

type Props = {
  jobCandidates: JobCandidate[]
}

function StatCard({
  icon,
  label,
  value,
  color,
  bg,
}: {
  icon: React.ReactNode
  label: string
  value: number
  color: string
  bg: string
}) {
  return (
    <div
      className="rounded-xl border p-4 flex items-center gap-3"
      style={{ backgroundColor: bg, borderColor: '#e8e5e0' }}
    >
      <div
        className="flex h-9 w-9 items-center justify-center rounded-lg shrink-0"
        style={{ backgroundColor: 'rgba(255,255,255,0.7)' }}
      >
        <span style={{ color }}>{icon}</span>
      </div>
      <div>
        <p className="text-2xl font-bold" style={{ fontFamily: 'var(--font-display)', color: '#1a1a1a' }}>
          {value}
        </p>
        <p className="text-xs" style={{ fontFamily: 'var(--font-body)', color: '#6b6560' }}>
          {label}
        </p>
      </div>
    </div>
  )
}

export function JobPerformancePanel({ jobCandidates }: Props) {
  const [expanded, setExpanded] = useState(true)

  const total = jobCandidates.length
  const active = jobCandidates.filter((jc) => jc.status === 'active').length
  const hired = jobCandidates.filter((jc) => jc.status === 'hired').length
  const rejected = jobCandidates.filter((jc) => jc.status === 'rejected').length
  const onHold = jobCandidates.filter((jc) => jc.status === 'on_hold').length
  const totalInterviews = jobCandidates.reduce((sum, jc) => sum + jc.interviews.length, 0)

  // Build stage funnel: for each stage, collect all interviews done there
  const stageMap = new Map<string, { pass: number; fail: number; on_hold: number; total: number }>()
  for (const jc of jobCandidates) {
    for (const interview of jc.interviews) {
      const name = interview.stage.name
      if (!stageMap.has(name)) {
        stageMap.set(name, { pass: 0, fail: 0, on_hold: 0, total: 0 })
      }
      const s = stageMap.get(name)!
      s.total++
      if (interview.outcome === 'pass') s.pass++
      else if (interview.outcome === 'fail') s.fail++
      else if (interview.outcome === 'on_hold') s.on_hold++
    }
  }

  const stageRows = Array.from(stageMap.entries())

  if (total === 0) return null

  return (
    <div
      className="rounded-xl border mb-6 overflow-hidden"
      style={{ backgroundColor: '#ffffff', borderColor: '#e8e5e0' }}
    >
      <button
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-[#faf9f7] transition-colors"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4" style={{ color: '#1e3a5f' }} />
          <span
            className="text-sm font-semibold"
            style={{ fontFamily: 'var(--font-body)', color: '#1a1a1a' }}
          >
            Pipeline Performance
          </span>
        </div>
        {expanded ? (
          <ChevronUp className="h-4 w-4" style={{ color: '#9c9690' }} />
        ) : (
          <ChevronDown className="h-4 w-4" style={{ color: '#9c9690' }} />
        )}
      </button>

      {expanded && (
        <div className="px-5 pb-5 space-y-5" style={{ borderTop: '1px solid #e8e5e0' }}>
          {/* Stat cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-5">
            <StatCard
              icon={<Users className="h-4 w-4" />}
              label="Total"
              value={total}
              color="#1e3a5f"
              bg="#eef2f7"
            />
            <StatCard
              icon={<Clock className="h-4 w-4" />}
              label="Active"
              value={active}
              color="#3b82f6"
              bg="#eff6ff"
            />
            <StatCard
              icon={<CheckCircle className="h-4 w-4" />}
              label="Hired"
              value={hired}
              color="#059669"
              bg="#ecfdf5"
            />
            <StatCard
              icon={<XCircle className="h-4 w-4" />}
              label="Rejected"
              value={rejected}
              color="#dc2626"
              bg="#fef2f2"
            />
            <StatCard
              icon={<Clock className="h-4 w-4" />}
              label="On Hold"
              value={onHold}
              color="#f59e0b"
              bg="#fffbeb"
            />
          </div>

          <div className="flex items-center gap-2 text-sm" style={{ fontFamily: 'var(--font-body)', color: '#6b6560' }}>
            <BarChart3 className="h-3.5 w-3.5" />
            <span>{totalInterviews} interview{totalInterviews !== 1 ? 's' : ''} conducted</span>
          </div>

          {/* Stage funnel table */}
          {stageRows.length > 0 && (
            <div>
              <p
                className="text-xs font-semibold uppercase tracking-wider mb-2"
                style={{ fontFamily: 'var(--font-body)', color: '#9c9690' }}
              >
                Stage Breakdown
              </p>
              <div className="rounded-lg border overflow-hidden" style={{ borderColor: '#e8e5e0' }}>
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ backgroundColor: '#faf9f7', borderBottom: '1px solid #e8e5e0' }}>
                      <th
                        className="text-left px-4 py-2.5 font-medium"
                        style={{ fontFamily: 'var(--font-body)', color: '#6b6560' }}
                      >
                        Stage
                      </th>
                      <th
                        className="text-right px-4 py-2.5 font-medium"
                        style={{ fontFamily: 'var(--font-body)', color: '#6b6560' }}
                      >
                        Interviews
                      </th>
                      <th
                        className="text-right px-4 py-2.5 font-medium"
                        style={{ fontFamily: 'var(--font-body)', color: '#059669' }}
                      >
                        Pass
                      </th>
                      <th
                        className="text-right px-4 py-2.5 font-medium"
                        style={{ fontFamily: 'var(--font-body)', color: '#dc2626' }}
                      >
                        Fail
                      </th>
                      <th
                        className="text-right px-4 py-2.5 font-medium"
                        style={{ fontFamily: 'var(--font-body)', color: '#f59e0b' }}
                      >
                        On Hold
                      </th>
                      <th
                        className="text-right px-4 py-2.5 font-medium"
                        style={{ fontFamily: 'var(--font-body)', color: '#6b6560' }}
                      >
                        Pass Rate
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {stageRows.map(([name, counts], i) => {
                      const passRate = counts.total > 0 ? Math.round((counts.pass / counts.total) * 100) : 0
                      return (
                        <tr
                          key={name}
                          style={i < stageRows.length - 1 ? { borderBottom: '1px solid #e8e5e0' } : {}}
                        >
                          <td
                            className="px-4 py-2.5"
                            style={{ fontFamily: 'var(--font-body)', color: '#1a1a1a' }}
                          >
                            {name}
                          </td>
                          <td
                            className="px-4 py-2.5 text-right"
                            style={{ fontFamily: 'var(--font-body)', color: '#6b6560' }}
                          >
                            {counts.total}
                          </td>
                          <td
                            className="px-4 py-2.5 text-right font-medium"
                            style={{ fontFamily: 'var(--font-body)', color: '#059669' }}
                          >
                            {counts.pass}
                          </td>
                          <td
                            className="px-4 py-2.5 text-right font-medium"
                            style={{ fontFamily: 'var(--font-body)', color: '#dc2626' }}
                          >
                            {counts.fail}
                          </td>
                          <td
                            className="px-4 py-2.5 text-right font-medium"
                            style={{ fontFamily: 'var(--font-body)', color: '#f59e0b' }}
                          >
                            {counts.on_hold}
                          </td>
                          <td className="px-4 py-2.5 text-right">
                            <span
                              className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border"
                              style={
                                passRate >= 60
                                  ? { color: '#059669', backgroundColor: '#ecfdf5', borderColor: '#a7f3d0' }
                                  : passRate >= 30
                                  ? { color: '#f59e0b', backgroundColor: '#fffbeb', borderColor: '#fde68a' }
                                  : { color: '#dc2626', backgroundColor: '#fef2f2', borderColor: '#fecaca' }
                              }
                            >
                              {passRate}%
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
