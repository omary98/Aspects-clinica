import { createAdminClient } from '@/lib/supabase/server'
import ServicesManager from '@/components/admin/ServicesManager'

export default async function ServicesPage() {
  const supabase = await createAdminClient()

  const [servicesRes, specialtiesRes, doctorsRes] = await Promise.all([
    supabase
      .from('services')
      .select('*, specialties (id, name_en), doctors (id, name_en), service_doctors (doctor_id, doctors (id, name_en))')
      .order('specialty_id')
      .order('display_order'),
    supabase.from('specialties').select('id, name_en').eq('is_active', true).order('display_order'),
    supabase.from('doctors').select('id, name_en, specialty_id').eq('is_active', true).order('display_order'),
  ])

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Services &amp; Procedures</h1>
      <ServicesManager
        services={servicesRes.data || []}
        specialties={specialtiesRes.data || []}
        doctors={doctorsRes.data || []}
      />
    </div>
  )
}
