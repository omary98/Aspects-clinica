import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/server'
import { getAdminOverrideSession } from '@/lib/admin/override-session'
import AdminSidebar from '@/components/admin/AdminSidebar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const overrideSession = await getAdminOverrideSession(await cookies())

  if (overrideSession) {
    return (
      <div className="flex min-h-screen flex-col bg-gray-50 lg:flex-row">
        <AdminSidebar adminName={overrideSession.fullName} adminRole={overrideSession.role} />
        <main className="w-full flex-1 min-w-0 overflow-x-hidden">
          <div className="w-full max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    )
  }

  const supabase = await createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/admin/login')
  }

  const { data: profileRaw } = await supabase
    .from('admin_profiles')
    .select('full_name, role, is_active')
    .eq('user_id', user.id)
    .single()

  const profile = profileRaw as { full_name: string; role: string; is_active: boolean } | null

  if (!profile || !profile.is_active) {
    redirect('/admin/login')
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 lg:flex-row">
      <AdminSidebar adminName={profile.full_name} adminRole={profile.role} />
      <main className="w-full flex-1 min-w-0 overflow-x-hidden">
        <div className="w-full max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
