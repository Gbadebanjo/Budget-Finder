'use client'

import { useUser } from '@/lib/hooks/useUser'
import type { Role } from '@/lib/types'

interface Props {
  allow: Role[]
  children: React.ReactNode
  fallback?: React.ReactNode
}

export default function RoleGuard({ allow, children, fallback = null }: Props) {
  const { profile, loading } = useUser()
  if (loading) return null
  if (!profile || !allow.includes(profile.role)) return <>{fallback}</>
  return <>{children}</>
}
