import { createClient } from '@/lib/supabase/server'
import SpecialtiesManager from '@/components/admin/SpecialtiesManager'

export default async function SpecialtiesPage() {
  const supabase = await createClient()
  const { data: specialties } = await supabase.from('specialties').select('*').order('display_order')

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Specialties</h1>
      <SpecialtiesManager specialties={specialties || []} />
    </div>
  )
}
