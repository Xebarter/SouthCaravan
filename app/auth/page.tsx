import * as React from 'react'
import { Suspense } from 'react'
import AuthClient from '@/app/auth/auth-client'

export default function AuthPage() {
  return (
    <Suspense fallback={null}>
      <AuthClient />
    </Suspense>
  )
}

