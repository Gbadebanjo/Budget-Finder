import { Logo } from '@/components/ui/primitives'
import Link from 'next/link'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-backdrop min-h-screen flex flex-col">
      <header className="px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Logo size={30} />
          <span className="font-semibold tracking-tight">FinFlow</span>
        </Link>
        <Link href="/login" className="text-xs text-muted hover:text-tx">Need help?</Link>
      </header>
      <main className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">{children}</div>
      </main>
    </div>
  )
}
