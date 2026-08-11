'use client'

import { useState } from 'react'
import { FileText, ExternalLink, Loader2 } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

interface CvViewLinkProps {
  /** Resolved signed (or external) URL for the CV. */
  url: string
  /** Shown as the dialog title, e.g. "Jane Smith — CV". */
  title: string
  /**
   * Whether the CV can be rendered inline. False for Word documents and
   * legacy external links, which open in a new tab instead.
   * See isPreviewableCv() in src/lib/s3.ts.
   */
  canPreview: boolean
  className?: string
  /** Renders the trailing ↗ hint used by the interview sidebar. */
  showExternalHint?: boolean
}

export function CvViewLink({
  url,
  title,
  canPreview,
  className,
  showExternalHint = false,
}: CvViewLinkProps) {
  const [open, setOpen] = useState(false)
  const [loaded, setLoaded] = useState(false)

  // Not previewable — keep the original new-tab behaviour.
  if (!canPreview) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className={cn('inline-flex items-center gap-1 hover:underline', className)}
        style={{ color: '#1e3a5f' }}
      >
        <FileText className="h-3.5 w-3.5" />
        View CV
        {showExternalHint && <span className="text-[10px]">↗</span>}
      </a>
    )
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn('inline-flex items-center gap-1 hover:underline', className)}
        style={{ color: '#1e3a5f' }}
      >
        <FileText className="h-3.5 w-3.5" />
        View CV
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-5xl h-[88vh] grid-rows-[auto_1fr] p-4">
          <DialogHeader className="pr-10">
            <DialogTitle className="truncate text-base" style={{ fontFamily: 'var(--font-display)' }}>
              {title}
            </DialogTitle>
          </DialogHeader>

          <div
            className="relative min-h-0 overflow-hidden rounded-lg border"
            style={{ borderColor: '#e8e5e0', backgroundColor: '#f8f7f4' }}
          >
            {!loaded && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin" style={{ color: '#6b6560' }} />
              </div>
            )}
            <iframe
              src={url}
              title={title}
              className="h-full w-full"
              onLoad={() => setLoaded(true)}
            />
          </div>

          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 justify-self-start text-xs hover:underline"
            style={{ fontFamily: 'var(--font-body)', color: '#6b6560' }}
          >
            <ExternalLink className="h-3 w-3" />
            Open in new tab
          </a>
        </DialogContent>
      </Dialog>
    </>
  )
}
