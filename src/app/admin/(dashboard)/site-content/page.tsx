import { createAdminClient } from '@/lib/supabase/server'
import SiteContentManager from '@/components/admin/SiteContentManager'

export default async function SiteContentPage() {
  const supabase = await createAdminClient()
  const [contentRes, settingsRes] = await Promise.all([
    supabase.from('site_content').select('*').order('section_key').order('display_order'),
    supabase.from('clinic_settings').select('key, value').in('key', ['landing_hero_background_url', 'landing_cta_background_url']),
  ])

  const settings = Object.fromEntries(((settingsRes.data || []) as Array<{ key: string; value: string }>).map((row) => [row.key, row.value]))

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900">Site Content</h1>
      <p className="text-sm text-gray-500 mt-1 mb-6">Edit homepage text, CTAs, footer copy, and landing backgrounds.</p>
      <SiteContentManager content={contentRes.data || []} settings={settings} />
    </div>
  )
}
