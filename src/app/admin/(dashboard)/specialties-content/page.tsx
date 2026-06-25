import { createAdminClient } from '@/lib/supabase/server'
import SpecialtiesManager from '@/components/admin/SpecialtiesManager'

export default async function SpecialtiesContentPage() {
  const supabase = await createAdminClient()
  const { data: specialties } = await supabase.from('specialties').select('*').order('display_order')

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900">Specialties Content</h1>
      <p className="text-sm text-gray-500 mt-1 mb-6">Edit specialty names, Arabic/English descriptions, icons, images, order, and visibility.</p>
      <SpecialtiesManager specialties={specialties || []} />
    </div>
  )
}
