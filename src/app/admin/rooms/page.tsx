import { createClient } from '@/lib/supabase/server'
import RoomsManager from '@/components/admin/RoomsManager'

export default async function RoomsPage() {
  const supabase = await createClient()
  const [roomsRes, branchesRes] = await Promise.all([
    supabase.from('rooms').select('*, branches (id, name_en)').order('branch_id'),
    supabase.from('branches').select('id, name_en').eq('is_active', true).order('display_order'),
  ])

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Rooms</h1>
      <RoomsManager rooms={roomsRes.data || []} branches={branchesRes.data || []} />
    </div>
  )
}
