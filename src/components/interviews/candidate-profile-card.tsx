import { User, Mail, Phone, FileText, Briefcase, Calendar } from 'lucide-react'
import { CvViewLink } from '@/components/candidates/cv-view-link'

interface CandidateProfileCardProps {
  candidate: {
    fullName: string
    email: string
    phone: string
    createdAt: Date
  }
  jobTitle: string
  stageName: string
  /** Resolved signed/external URL for the candidate's CV, or null. */
  cvUrl: string | null
  /** Whether the CV renders inline (self-hosted PDF) or opens in a new tab. */
  cvPreviewable: boolean
}

export function CandidateProfileCard({
  candidate,
  jobTitle,
  stageName,
  cvUrl,
  cvPreviewable,
}: CandidateProfileCardProps) {
  return (
    <div
      className="rounded-xl border bg-white p-5 space-y-5"
      style={{ borderColor: '#e8e5e0' }}
    >
      {/* Avatar + Name */}
      <div className="flex flex-col items-center text-center gap-3">
        <div
          className="flex h-14 w-14 items-center justify-center rounded-full text-lg font-bold text-white"
          style={{ backgroundColor: '#1e3a5f' }}
        >
          {candidate.fullName
            .split(' ')
            .slice(0, 2)
            .map((n) => n[0])
            .join('')
            .toUpperCase()}
        </div>
        <div>
          <p
            className="text-base font-semibold"
            style={{ fontFamily: 'var(--font-body)', color: '#1a1a1a' }}
          >
            {candidate.fullName}
          </p>
          <p
            className="text-xs mt-0.5"
            style={{ fontFamily: 'var(--font-body)', color: '#9c9690' }}
          >
            Candidate
          </p>
        </div>
      </div>

      <hr style={{ borderColor: '#e8e5e0' }} />

      {/* Details */}
      <div className="space-y-3">
        <ProfileRow icon={<Mail className="h-4 w-4" />} label="Email">
          <a
            href={`mailto:${candidate.email}`}
            className="hover:underline break-all"
            style={{ color: '#1e3a5f' }}
          >
            {candidate.email}
          </a>
        </ProfileRow>

        <ProfileRow icon={<Phone className="h-4 w-4" />} label="Phone">
          <a
            href={`tel:${candidate.phone}`}
            className="hover:underline"
            style={{ color: '#1e3a5f' }}
          >
            {candidate.phone}
          </a>
        </ProfileRow>

        <ProfileRow icon={<Briefcase className="h-4 w-4" />} label="Job">
          <span>{jobTitle}</span>
        </ProfileRow>

        <ProfileRow icon={<User className="h-4 w-4" />} label="Stage">
          <span
            className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
            style={{ backgroundColor: '#fef6ee', color: '#e8913a' }}
          >
            {stageName}
          </span>
        </ProfileRow>

        <ProfileRow icon={<Calendar className="h-4 w-4" />} label="Added">
          <span>{new Date(candidate.createdAt).toLocaleDateString()}</span>
        </ProfileRow>

        {cvUrl && (
          <ProfileRow icon={<FileText className="h-4 w-4" />} label="CV">
            <CvViewLink
              url={cvUrl}
              title={`${candidate.fullName} — CV`}
              canPreview={cvPreviewable}
              showExternalHint={!cvPreviewable}
            />
          </ProfileRow>
        )}
      </div>
    </div>
  )
}

function ProfileRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 shrink-0" style={{ color: '#9c9690' }}>
        {icon}
      </div>
      <div className="min-w-0">
        <p
          className="text-[11px] font-medium uppercase tracking-wide"
          style={{ fontFamily: 'var(--font-body)', color: '#9c9690' }}
        >
          {label}
        </p>
        <div
          className="text-sm mt-0.5"
          style={{ fontFamily: 'var(--font-body)', color: '#1a1a1a' }}
        >
          {children}
        </div>
      </div>
    </div>
  )
}
