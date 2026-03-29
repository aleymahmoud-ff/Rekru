'use client'

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string }
}) {
  return (
    <html>
      <body style={{ fontFamily: 'monospace', padding: '2rem' }}>
        <h1>Something went wrong</h1>
        <pre style={{ color: 'red', whiteSpace: 'pre-wrap' }}>
          {error.message}
        </pre>
        {error.digest && <p>Digest: {error.digest}</p>}
        <button onClick={() => window.location.reload()}>Reload</button>
      </body>
    </html>
  )
}
