'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { adminManage, uploadAdminImage } from '@/lib/admin/client-actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2, Save } from 'lucide-react'
import type { ClinicSetting } from '@/types/database'

const SETTING_LABELS: Record<string, { label: string; description: string; type?: string }> = {
  booking_window_days: { label: 'Booking Window (days)', description: 'How many days ahead patients can book', type: 'number' },
  min_notice_hours: { label: 'Minimum Notice (hours)', description: 'Minimum notice for same-day bookings', type: 'number' },
  default_appointment_duration_minutes: { label: 'Default Slot Duration (minutes)', description: 'Default appointment duration when no service is selected', type: 'number' },
  first_come_default_daily_capacity: { label: 'Default First-Come Capacity', description: 'Default number of patients for new first-come clinic sessions', type: 'number' },
  email_from: { label: 'From Email Address', description: 'Sender email for patient confirmations' },
  whatsapp_enabled: { label: 'WhatsApp Enabled', description: 'Set to "true" when provider is connected' },
  clinic_name_en: { label: 'Clinic Name (English)', description: 'Used in emails and notifications' },
  clinic_name_ar: { label: 'Clinic Name (Arabic)', description: 'Used in Arabic communications' },
  clinic_phone: { label: 'Clinic Phone', description: 'Main phone number displayed on the site' },
  logo_url: { label: 'EuroCure Logo URL', description: 'Logo displayed in the navigation and footer' },
  landing_hero_background_url: { label: 'Landing Hero Background URL', description: 'Main landing page background image' },
  landing_cta_background_url: { label: 'CTA Background URL', description: 'Optional background image for the booking call-to-action section' },
  landing_hero_tagline_en: { label: 'Hero Tagline (English)', description: 'Optional custom landing page tagline' },
  landing_hero_title_en: { label: 'Hero Title (English)', description: 'Optional custom landing page title' },
  landing_hero_subtitle_en: { label: 'Hero Subtitle (English)', description: 'Optional custom landing page subtitle' },
}

export default function ClinicSettingsManager({ settings }: { settings: ClinicSetting[] }) {
  const router = useRouter()
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(settings.map((s) => [s.key, s.value]))
  )
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [uploadingKey, setUploadingKey] = useState<string | null>(null)

  async function handleSave() {
    setLoading(true)
    setError('')
    try {
      await adminManage({
        resource: 'clinic-settings',
        action: 'upsert',
        values,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save settings.')
      setLoading(false)
      return
    }
    setLoading(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    router.refresh()
  }

  async function handleSettingImageUpload(key: string, file: File | null) {
    if (!file) return

    setUploadingKey(key)
    setError('')
    try {
      const url = await uploadAdminImage(file, key)
      setValues((current) => ({ ...current, [key]: url }))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not upload image.')
    } finally {
      setUploadingKey(null)
    }
  }

  const orderedKeys = [
    'booking_window_days', 'min_notice_hours', 'default_appointment_duration_minutes', 'first_come_default_daily_capacity',
    'clinic_name_en', 'clinic_name_ar', 'clinic_phone',
    'email_from', 'whatsapp_enabled',
  ]

  const contentKeys = [
    'logo_url',
    'landing_hero_background_url',
    'landing_cta_background_url',
    'landing_hero_tagline_en',
    'landing_hero_title_en',
    'landing_hero_subtitle_en',
  ]

  return (
    <div className="space-y-6 max-w-2xl">
      <Card>
        <CardContent className="pt-5 space-y-5">
          {orderedKeys.map((key) => {
            const meta = SETTING_LABELS[key]
            if (!meta) return null
            return (
              <div key={key} className="space-y-1.5">
                <Label htmlFor={key}>{meta.label}</Label>
                <Input
                  id={key}
                  type={meta.type || 'text'}
                  value={values[key] || ''}
                  onChange={(e) => setValues({ ...values, [key]: e.target.value })}
                />
                <p className="text-xs text-gray-400">{meta.description}</p>
                {key.endsWith('_url') && (
                  <div className="space-y-1.5">
                    <Input
                      type="file"
                      accept="image/*"
                      disabled={uploadingKey === key}
                      onChange={(e) => handleSettingImageUpload(key, e.target.files?.[0] || null)}
                    />
                    {uploadingKey === key && <p className="text-xs text-gray-400">Uploading image...</p>}
                  </div>
                )}
              </div>
            )
          })}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-5 space-y-5">
          <h3 className="font-semibold text-gray-900">Branding and Landing Page</h3>
          {contentKeys.map((key) => {
            const meta = SETTING_LABELS[key]
            return (
              <div key={key} className="space-y-1.5">
                <Label htmlFor={key}>{meta.label}</Label>
                <Input
                  id={key}
                  value={values[key] || ''}
                  onChange={(e) => setValues({ ...values, [key]: e.target.value })}
                  placeholder={key.endsWith('_url') ? 'https://...' : undefined}
                />
                <p className="text-xs text-gray-400">{meta.description}</p>
                {key.endsWith('_url') && (
                  <div className="space-y-1.5">
                    <Input
                      type="file"
                      accept="image/*"
                      disabled={uploadingKey === key}
                      onChange={(e) => handleSettingImageUpload(key, e.target.files?.[0] || null)}
                    />
                    {uploadingKey === key && <p className="text-xs text-gray-400">Uploading image...</p>}
                  </div>
                )}
              </div>
            )
          })}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-5">
          <h3 className="font-semibold text-gray-900 mb-3">Email Provider</h3>
          <p className="text-sm text-gray-500 mb-3">
            EuroCure uses <strong>Resend</strong> for email delivery. Set your API key in the
            environment variable <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">RESEND_API_KEY</code> in Vercel Project Settings.
          </p>
          <div className="space-y-1.5">
            <Label>From Email Address</Label>
            <Input
              type="email"
              value={values['email_from'] || ''}
              onChange={(e) => setValues({ ...values, email_from: e.target.value })}
              placeholder="reservations@eurocure.clinic"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-5">
          <h3 className="font-semibold text-gray-900 mb-3">WhatsApp (v2)</h3>
          <p className="text-sm text-gray-500">
            WhatsApp notification payloads are logged but not sent in v1.
            To activate in v2: set your provider key in <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">WHATSAPP_PROVIDER_PLACEHOLDER_KEY</code>
            and update <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">src/lib/notifications/whatsapp-placeholder.ts</code>.
          </p>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        {error && (
          <div className="mr-auto p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
            {error}
          </div>
        )}
        <Button
          onClick={handleSave}
          disabled={loading}
          className={`${saved ? 'bg-green-600 hover:bg-green-700' : 'bg-[#1B4F72] hover:bg-[#154360]'} text-white`}
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          {saved ? 'Saved!' : 'Save Settings'}
        </Button>
      </div>
    </div>
  )
}
