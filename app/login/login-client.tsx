'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function LoginClient() {
  const router = useRouter()
  const params = useSearchParams()

  useEffect(() => {
    const next = params.get('next') ?? ''
    const role = params.get('role') ?? ''

    const qs = new URLSearchParams()
    // Production default: generic login routes to /dashboard, which performs a
    // server-side role redirect.
    qs.set('role', role || 'auto')
    qs.set('next', next || '/dashboard')

    router.replace(`/auth${qs.toString() ? `?${qs.toString()}` : ''}`)
  }, [router, params])

  return null
}

