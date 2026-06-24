import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AdminSidebar from '@/components/admin/AdminSidebar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()

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
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar adminName={profile.full_name} adminRole={profile.role} />
      <main className="flex-1 min-w-0 overflow-auto">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
