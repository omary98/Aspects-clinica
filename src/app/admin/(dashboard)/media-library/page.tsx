import { createAdminClient } from '@/lib/supabase/server'
import MediaLibraryManager from '@/components/admin/MediaLibraryManager'

export default async function MediaLibraryPage() {
  const supabase = await createAdminClient()
  const { data } = await supabase.from('site_assets').select('*').order('created_at', { ascending: false })

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900">Media Library</h1>
      <p className="text-sm text-gray-500 mt-1 mb-6">Upload, preview, copy, and safely delete public site images.</p>
      <MediaLibraryManager assets={data || []} />
    </div>
  )
}
