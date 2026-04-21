'use client';

import { useEffect } from 'react';

/**
 * global-error.tsx catches errors thrown by the root layout itself.
 * It must include its own <html> and <body> tags since the root layout
 * is unavailable when this renders.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif', background: '#fff', color: '#111' }}>
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
        >
          <div style={{ textAlign: 'center', maxWidth: 480 }}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width={64}
              height={64}
              viewBox="0 0 24 24"
              fill="none"
              stroke="#ef4444"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ margin: '0 auto 1.5rem' }}
            >
              <path d="m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" />
              <path d="M12 9v4" />
              <path d="M12 17h.01" />
            </svg>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              Something went wrong
            </h1>
            <p style={{ color: '#6b7280', marginBottom: '1.5rem', lineHeight: 1.6 }}>
              A critical error occurred. Our team has been notified. Please try refreshing the page.
            </p>
            {process.env.NODE_ENV === 'development' && error.message && (
              <pre
                style={{
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: 6,
                  padding: '0.75rem 1rem',
                  textAlign: 'left',
                  fontSize: '0.8rem',
                  color: '#dc2626',
                  overflowX: 'auto',
                  marginBottom: '1.5rem',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                {error.message}
              </pre>
            )}
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={() => reset()}
                style={{
                  padding: '0.6rem 1.4rem',
                  background: '#111',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Try Again
              </button>
              <a
                href="/"
                style={{
                  padding: '0.6rem 1.4rem',
                  background: 'transparent',
                  color: '#111',
                  border: '1px solid #d1d5db',
                  borderRadius: 8,
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  textDecoration: 'none',
                  display: 'inline-block',
                }}
              >
                Go Home
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
