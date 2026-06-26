'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Search, User, Filter, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useLanguage } from '@/components/LanguageProvider'

type DirectorySpecialty = {
  id: string
  name_en: string
  name_ar: string
}

type DirectoryDoctor = {
  id: string
  name_en: string
  name_ar: string
  title_en: string
  title_ar: string
  bio_en: string | null
  bio_ar: string | null
  photo_url: string | null
  specialty_id: string
  specialties: DirectorySpecialty | null
  doctor_schedule_templates?: Array<{ id: string; is_active: boolean }> | null
}

export default function DoctorsDirectory({
  doctors,
  specialties,
}: {
  doctors: DirectoryDoctor[]
  specialties: DirectorySpecialty[]
}) {
  const { lang, t } = useLanguage()
  const [query, setQuery] = useState('')
  const [specialtyId, setSpecialtyId] = useState('all')
  const [availability, setAvailability] = useState('all')
  const nameField = lang === 'ar' ? 'name_ar' : 'name_en'
  const titleField = lang === 'ar' ? 'title_ar' : 'title_en'
  const bioField = lang === 'ar' ? 'bio_ar' : 'bio_en'
  const normalizedQuery = query.trim().toLowerCase()

  const filtered = useMemo(() => {
    return doctors.filter((doctor) => {
      const matchesSpecialty = specialtyId === 'all' || doctor.specialty_id === specialtyId
      if (!matchesSpecialty) return false
      const hasActiveSchedule = (doctor.doctor_schedule_templates || []).some((schedule) => schedule.is_active)
      if (availability === 'available' && !hasActiveSchedule) return false
      if (availability === 'awaiting' && hasActiveSchedule) return false
      if (!normalizedQuery) return true
      const haystack = [
        doctor.name_en,
        doctor.name_ar,
        doctor.title_en,
        doctor.title_ar,
        doctor.bio_en || '',
        doctor.bio_ar || '',
        doctor.specialties?.name_en || '',
        doctor.specialties?.name_ar || '',
      ].join(' ').toLowerCase()
      return haystack.includes(normalizedQuery)
    })
  }, [availability, doctors, normalizedQuery, specialtyId])

  return (
    <div className="space-y-8">
      <div className="aspects-surface grid gap-3 rounded-lg border border-gray-100 bg-white p-4 md:grid-cols-[1fr_240px_240px]">
        <div className="relative">
          <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={lang === 'ar' ? 'ابحث باسم الطبيب أو التخصص...' : 'Search by doctor or specialty...'}
            className="ps-10"
          />
        </div>
        <Select value={specialtyId} onValueChange={setSpecialtyId}>
          <SelectTrigger className="booking-select-trigger">
            <Filter className="me-2 h-4 w-4 text-[#0B8EA0]" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{lang === 'ar' ? 'كل التخصصات' : 'All specialties'}</SelectItem>
            {specialties.map((specialty) => (
              <SelectItem key={specialty.id} value={specialty.id}>
                {specialty[nameField] || specialty.name_en}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={availability} onValueChange={setAvailability}>
          <SelectTrigger className="booking-select-trigger">
            <Filter className="me-2 h-4 w-4 text-[#0B8EA0]" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{lang === 'ar' ? 'كل حالات التوفر' : 'All availability'}</SelectItem>
            <SelectItem value="available">{lang === 'ar' ? 'لديهم مواعيد متاحة' : 'Has active schedule'}</SelectItem>
            <SelectItem value="awaiting">{lang === 'ar' ? 'بانتظار إضافة مواعيد' : 'Awaiting schedule'}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((doctor) => (
          <article key={doctor.id} className="aspects-specialty-card rounded-lg border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#E6FAF6] text-[#0B8EA0]">
                {doctor.photo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={doctor.photo_url} alt={doctor[nameField]} className="h-full w-full object-cover" />
                ) : (
                  <User className="h-7 w-7" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="font-bold text-gray-900">{doctor[nameField] || doctor.name_en}</h2>
                <p className="mt-1 text-sm font-medium text-[#0B8EA0]">{doctor[titleField] || doctor.title_en}</p>
                {doctor.specialties && (
                  <p className="mt-1 text-xs text-gray-500">{doctor.specialties[nameField] || doctor.specialties.name_en}</p>
                )}
              </div>
            </div>

            {doctor[bioField] && (
              <p className="mt-4 line-clamp-2 min-h-[3rem] text-sm leading-6 text-gray-500">{doctor[bioField]}</p>
            )}

            <div className="mt-5">
              <Link href={`/book?doctor=${doctor.id}`}>
                <Button size="sm" className="aspects-primary-cta w-full bg-[#101010] text-white hover:bg-black">
                  {t.doctors.bookWith} {doctor[nameField] || doctor.name_en}
                  <ChevronRight className={`ms-1 h-4 w-4 ${lang === 'ar' ? 'rotate-180' : ''}`} />
                </Button>
              </Link>
            </div>
          </article>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="aspects-surface rounded-lg border border-gray-100 bg-white p-8 text-center text-gray-500">
          {lang === 'ar' ? 'لا يوجد أطباء مطابقون للبحث.' : 'No matching doctors found.'}
        </div>
      )}
    </div>
  )
}
