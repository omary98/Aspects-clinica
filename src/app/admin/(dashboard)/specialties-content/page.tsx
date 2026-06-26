import { createAdminClient } from '@/lib/supabase/server'
import SpecialtiesManager from '@/components/admin/SpecialtiesManager'

export default async function SpecialtiesContentPage() {
  const supabase = await createAdminClient()
  const [specialtiesRes, servicesRes] = await Promise.all([
    supabase.from('specialties').select('*').order('display_order'),
    supabase.from('services').select('id, specialty_id').eq('is_active', true),
  ])
  const services = (servicesRes.data || []) as Array<{ specialty_id: string }>
  const serviceCounts = services.reduce<Record<string, number>>((acc, service) => {
    acc[service.specialty_id] = (acc[service.specialty_id] || 0) + 1
    return acc
  }, {})

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900">Specialties Content</h1>
      <p className="text-sm text-gray-500 mt-1 mb-6">Edit specialty names, Arabic/English descriptions, icons, images, order, and visibility.</p>
      <SpecialtiesManager specialties={specialtiesRes.data || []} serviceCounts={serviceCounts} />
    </div>
  )
}
