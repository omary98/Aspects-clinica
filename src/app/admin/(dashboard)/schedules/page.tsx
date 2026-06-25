import { createAdminClient } from '@/lib/supabase/server'
import SchedulesManager from '@/components/admin/SchedulesManager'

export default async function SchedulesPage() {
  const supabase = await createAdminClient()

  const [schedulesRes, doctorsRes, branchesRes, roomsRes] = await Promise.all([
    supabase
      .from('doctor_schedule_templates')
      .select(`
        *,
        doctors (id, name_en),
        branches (id, name_en),
        schedule_room_assignments (room_id, rooms (id, name_en))
      `)
      .order('doctor_id')
      .order('day_of_week'),
    supabase.from('doctors').select('id, name_en').eq('is_active', true).order('display_order'),
    supabase.from('branches').select('id, name_en').eq('is_active', true).order('display_order'),
    supabase.from('rooms').select('id, name_en, branch_id').eq('is_active', true),
  ])

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Schedules</h1>
      <SchedulesManager
        schedules={schedulesRes.data || []}
        doctors={doctorsRes.data || []}
        branches={branchesRes.data || []}
        rooms={roomsRes.data || []}
      />
    </div>
  )
}
