import { createAdminClient } from '@/lib/supabase/server'
import BrandingManager from '@/components/admin/BrandingManager'

export default async function BrandingPage() {
  const supabase = await createAdminClient()
  const { data } = await supabase
    .from('clinic_settings')
    .select('key, value')
    .in('key', ['logo_url', 'header_logo_url', 'footer_logo_url', 'favicon_url', 'brand_primary_color', 'brand_accent_color', 'brand_background_color'])

  const settings = Object.fromEntries(((data || []) as Array<{ key: string; value: string }>).map((row) => [row.key, row.value]))

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900">Branding</h1>
      <p className="text-sm text-gray-500 mt-1 mb-6">Manage EuroCure logos, favicon, and public brand colors.</p>
      <BrandingManager settings={settings} />
    </div>
  )
}
