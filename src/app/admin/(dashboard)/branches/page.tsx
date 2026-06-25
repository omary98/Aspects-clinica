import { createAdminClient } from '@/lib/supabase/server'
import BranchesManager from '@/components/admin/BranchesManager'

export default async function BranchesPage() {
  const supabase = await createAdminClient()
  const { data: branches } = await supabase
    .from('branches')
    .select('*')
    .order('display_order')

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Branches</h1>
      <BranchesManager branches={branches || []} />
    </div>
  )
}
