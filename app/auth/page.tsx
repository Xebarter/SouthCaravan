import { Suspense } from 'react'
import AuthClient from '@/app/auth/auth-client'
import { AuthPageLoading } from '@/components/auth-chrome'

export default function AuthPage() {
  return (
    <Suspense fallback={<AuthPageLoading />}>
      <AuthClient />
    </Suspense>
  )
}

