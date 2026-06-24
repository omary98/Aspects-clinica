import { createClient } from '@/lib/supabase/server'
import DoctorsManager from '@/components/admin/DoctorsManager'

export default async function DoctorsPage() {
  const supabase = await createClient()

  const [doctorsRes, specialtiesRes] = await Promise.all([
    supabase
      .from('doctors')
      .select('*, specialties (id, name_en)')
      .order('display_order'),
    supabase
      .from('specialties')
      .select('id, name_en')
      .eq('is_active', true)
      .order('display_order'),
  ])

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Doctors</h1>
      <DoctorsManager
        doctors={doctorsRes.data || []}
        specialties={specialtiesRes.data || []}
      />
    </div>
  )
}
