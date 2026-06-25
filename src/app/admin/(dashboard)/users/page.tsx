import { createAdminClient } from '@/lib/supabase/server'
import AdminUsersManager from '@/components/admin/AdminUsersManager'

export default async function AdminUsersPage() {
  const supabase = await createAdminClient()

  const { data: profiles } = await supabase
    .from('admin_profiles')
    .select('*, notification_recipients (email_enabled, whatsapp_enabled)')
    .order('created_at')

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Admin Users</h1>
      <p className="text-gray-500 text-sm mb-6">
        Manage admin accounts and notification preferences. To create a new admin user, first create
        a Supabase Auth user via the Supabase dashboard, then add their profile here.
      </p>
      <AdminUsersManager profiles={profiles || []} />
    </div>
  )
}
