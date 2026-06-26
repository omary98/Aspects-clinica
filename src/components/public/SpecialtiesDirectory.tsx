'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Search, Stethoscope, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useLanguage } from '@/components/LanguageProvider'

type DirectoryService = {
  id: string
  specialty_id: string
  name_en: string
  name_ar: string
  is_active?: boolean
}

type DirectorySpecialty = {
  id: string
  name_en: string
  name_ar: string
  slug: string
  description_en: string | null
  description_ar: string | null
  image_url: string | null
}

export default function SpecialtiesDirectory({
  specialties,
  services,
}: {
  specialties: DirectorySpecialty[]
  services: DirectoryService[]
}) {
  const { lang, t } = useLanguage()
  const [query, setQuery] = useState('')
  const nameField = lang === 'ar' ? 'name_ar' : 'name_en'
  const descField = lang === 'ar' ? 'description_ar' : 'description_en'
  const normalizedQuery = query.trim().toLowerCase()

  const filtered = useMemo(() => {
    return specialties.filter((specialty) => {
      if (!normalizedQuery) return true
      const specialtyServices = services.filter((service) => service.specialty_id === specialty.id)
      const haystack = [
        specialty.name_en,
        specialty.name_ar,
        specialty.description_en || '',
        specialty.description_ar || '',
        ...specialtyServices.flatMap((service) => [service.name_en, service.name_ar]),
      ].join(' ').toLowerCase()
      return haystack.includes(normalizedQuery)
    })
  }, [normalizedQuery, services, specialties])

  return (
    <div className="space-y-8">
      <div className="aspects-surface rounded-lg border border-gray-100 bg-white p-4">
        <div className="relative">
          <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={lang === 'ar' ? 'ابحث عن تخصص أو إجراء...' : 'Search specialties or procedures...'}
            className="ps-10"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((specialty) => {
          const specialtyServices = services.filter((service) => service.specialty_id === specialty.id).slice(0, 5)
          return (
            <article key={specialty.id} className="aspects-specialty-card rounded-lg border border-gray-100 bg-white p-5 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#E6FAF6] text-[#0B8EA0]">
                  {specialty.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={specialty.image_url} alt={specialty[nameField]} className="h-full w-full object-cover" />
                  ) : (
                    <Stethoscope className="h-6 w-6" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg font-bold text-gray-900">{specialty[nameField] || specialty.name_en}</h2>
                  {specialty[descField] && (
                    <p className="mt-1 line-clamp-2 text-sm leading-6 text-gray-500">{specialty[descField]}</p>
                  )}
                </div>
              </div>

              {specialtyServices.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {specialtyServices.map((service) => (
                    <span key={service.id} className="rounded-full border border-[#19B7C6]/25 px-3 py-1 text-xs text-gray-600">
                      {service[nameField] || service.name_en}
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-5">
                <Link href={`/book?specialty=${specialty.id}`}>
                  <Button size="sm" className="aspects-primary-cta w-full bg-[#101010] text-white hover:bg-black">
                    {t.specialties.bookIn} {specialty[nameField] || specialty.name_en}
                    <ChevronRight className={`ms-1 h-4 w-4 ${lang === 'ar' ? 'rotate-180' : ''}`} />
                  </Button>
                </Link>
              </div>
            </article>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <div className="aspects-surface rounded-lg border border-gray-100 bg-white p-8 text-center text-gray-500">
          {lang === 'ar' ? 'لا توجد نتائج مطابقة.' : 'No matching specialties found.'}
        </div>
      )}
    </div>
  )
}
