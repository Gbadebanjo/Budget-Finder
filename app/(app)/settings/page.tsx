import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getCurrentWorkspace, getSession } from '@/lib/supabase/queries'
import { createClient } from '@/lib/supabase/server'
import { GlassCard, Section, Button, Chip } from '@/components/ui/primitives'
import { Icon } from '@/components/ui/Icon'
import { ProfileForm } from './ProfileForm'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const user = await getSession()
  if (!user) redirect('/login')
  const ws = await getCurrentWorkspace()
  if (!ws) redirect('/login')
  const supabase = await createClient()
  const { data: profile } = await supabase.from('user_profiles').select('*').eq('id', user.id).single()

  return (
    <div className="space-y-6 max-w-3xl">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted mt-1">Tune FinFlow to your taste.</p>
      </header>

      <GlassCard>
        <Section title="Profile" description="Used across FinFlow.">
          <ProfileForm
            userId={user.id}
            initial={{
              full_name: profile?.full_name ?? '',
              display_currency: profile?.display_currency ?? 'NGN',
              locale: profile?.locale ?? 'en-NG',
            }}
            email={user.email ?? ''}
          />
        </Section>
      </GlassCard>

      <GlassCard>
        <Section title="Workspace">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 grid place-items-center text-white font-semibold">
                {ws.name.slice(0, 1).toUpperCase()}
              </span>
              <div>
                <p className="font-medium">{ws.name}</p>
                <p className="text-xs text-muted">{ws.is_personal ? 'Personal workspace' : 'Shared workspace'} · {ws.timezone}</p>
              </div>
            </div>
            <Chip tone="accent" icon="sparkles">Personal</Chip>
          </div>
        </Section>
      </GlassCard>

      <GlassCard>
        <Section title="Connections" description="Banks and payment partners.">
          <ConnectionRow icon="link" title="Mono" status={process.env.NEXT_PUBLIC_MONO_PUBLIC_KEY ? 'connected' : 'missing'} href="/accounts?link=1" />
          <ConnectionRow icon="credit-card" title="Paystack billing" status={process.env.PAYSTACK_SECRET_KEY ? 'connected' : 'missing'} href="/settings/billing" />
        </Section>
      </GlassCard>

      <GlassCard>
        <Section title="Danger zone">
          <p className="text-xs text-muted mb-3">Sign out, or delete this workspace. Deletion is permanent.</p>
          <div className="flex gap-2">
            <Button href="/api/auth/signout" variant="secondary" icon="log-out">Sign out</Button>
            <Button variant="danger" icon="x" disabled>Delete workspace</Button>
          </div>
        </Section>
      </GlassCard>
    </div>
  )
}

function ConnectionRow({ icon, title, status, href }: { icon: string; title: string; status: 'connected' | 'missing'; href: string }) {
  return (
    <Link href={href} className="flex items-center justify-between p-3 rounded-xl hover:bg-surface-alt transition">
      <div className="flex items-center gap-3">
        <span className="h-9 w-9 rounded-lg bg-surface-alt grid place-items-center"><Icon name={icon} size={16} /></span>
        <div>
          <p className="text-sm font-medium">{title}</p>
          <p className="text-xs text-muted">{status === 'connected' ? 'Ready to use' : 'Not configured in env'}</p>
        </div>
      </div>
      {status === 'connected'
        ? <Chip tone="success" dot>Connected</Chip>
        : <Chip tone="warning" dot>Set up</Chip>}
    </Link>
  )
}
