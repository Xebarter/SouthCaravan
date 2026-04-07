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
    if (role) qs.set('role', role)
    if (next) qs.set('next', next)

    router.replace(`/auth${qs.toString() ? `?${qs.toString()}` : ''}`)
  }, [router, params])

  return null
}

