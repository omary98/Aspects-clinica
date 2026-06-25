import { createAdminClient } from '@/lib/supabase/server'
import BlockedTimesManager from '@/components/admin/BlockedTimesManager'

export default async function BlockedTimesPage() {
  const supabase = await createAdminClient()

  const [blockedRes, doctorsRes, roomsRes, branchesRes] = await Promise.all([
    supabase
      .from('blocked_times')
      .select(`*, doctors (id, name_en), rooms (id, name_en), branches (id, name_en)`)
      .order('block_date', { ascending: false }),
    supabase.from('doctors').select('id, name_en').eq('is_active', true).order('display_order'),
    supabase.from('rooms').select('id, name_en, branch_id').eq('is_active', true),
    supabase.from('branches').select('id, name_en').eq('is_active', true).order('display_order'),
  ])

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Blocked Times &amp; Holidays</h1>
      <BlockedTimesManager
        blocked={blockedRes.data || []}
        doctors={doctorsRes.data || []}
        rooms={roomsRes.data || []}
        branches={branchesRes.data || []}
      />
    </div>
  )
}
