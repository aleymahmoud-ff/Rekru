interface PageHeaderProps {
  title: string
  description?: string
  action?: React.ReactNode
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div className="space-y-1 min-w-0">
        <h1
          className="text-[28px] font-bold leading-tight truncate"
          style={{
            fontFamily: 'var(--font-display)',
            color: '#1a1a1a',
          }}
        >
          {title}
        </h1>
        {description && (
          <p
            className="text-sm"
            style={{
              fontFamily: 'var(--font-body)',
              color: '#6b6560',
            }}
          >
            {description}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
