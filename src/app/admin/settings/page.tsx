import { createClient } from '@/lib/supabase/server'
import ClinicSettingsManager from '@/components/admin/ClinicSettingsManager'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: settings } = await supabase.from('clinic_settings').select('*').order('key')

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Clinic Settings</h1>
      <p className="text-gray-500 text-sm mb-6">
        Configure global booking rules, notification settings, and clinic information.
      </p>
      <ClinicSettingsManager settings={settings || []} />
    </div>
  )
}
