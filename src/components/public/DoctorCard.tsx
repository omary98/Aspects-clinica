import Link from 'next/link'
import { MapPin, Clock, ChevronRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { Doctor, Specialty, Branch, ScheduleTemplate } from '@/types/database'
import { getT, type Lang } from '@/lib/i18n'

interface DoctorCardProps {
  lang: Lang
  doctor: Doctor & {
    specialties: Pick<Specialty, 'name_en' | 'name_ar'>
    schedules: (Pick<ScheduleTemplate, 'day_of_week' | 'start_time' | 'end_time' | 'branch_id'> & {
      branches: Pick<Branch, 'id' | 'name_en' | 'name_ar' | 'is_public_branch'>
    })[]
  }
}

export default function DoctorCard({ doctor, lang }: DoctorCardProps) {
  const t = getT(lang)
  const uniqueBranches = Array.from(
    new Map(doctor.schedules.map((s) => [s.branch_id, s.branches])).values()
  )
  const isMultiLocation = uniqueBranches.length > 1
  const nameField = lang === 'ar' ? 'name_ar' : 'name_en'
  const titleField = lang === 'ar' ? 'title_ar' : 'title_en'
  const doctorName = (doctor as any)[nameField] || doctor.name_en
  const doctorTitle = (doctor as any)[titleField] || doctor.title_en
  const specialtyName =
    lang === 'ar' ? doctor.specialties.name_ar : doctor.specialties.name_en
  const bioField = lang === 'ar' ? 'bio_ar' : 'bio_en'
  const bio = (doctor as any)[bioField] || null

  const initials = doctor.name_en.split(' ')[1]?.[0] || doctor.name_en[0] || '?'

  return (
    <Card className="eurocure-specialty-card hover:shadow-md transition-shadow duration-200 border border-gray-100 h-full flex flex-col">
      <CardContent className="p-6 flex flex-col h-full">
        <div className="flex items-start gap-4">
          {/* Avatar / Photo */}
          <div className="flex-shrink-0">
            {doctor.photo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={doctor.photo_url}
                alt={doctor.name_en}
                className="w-16 h-16 rounded-full object-cover border-2 border-[#D8A83E]/40"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#FFF3C7] to-[#D8A83E]/20 flex items-center justify-center border border-[#D8A83E]/30">
                <span className="text-[#9A6A16] font-bold text-xl">{initials.toUpperCase()}</span>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-gray-900 text-base leading-snug">{doctorName}</h3>
            <p className="text-sm text-[#9A6A16] font-medium mt-0.5">{doctorTitle}</p>
            <p className="text-xs text-gray-500 mt-1">{specialtyName}</p>

            {/* Consultation fee */}
            {doctor.consultation_fee !== null && doctor.consultation_fee !== undefined && (
              <p className="text-sm font-semibold text-gray-700 mt-2">
                {t.doctors.consultation}: {doctor.consultation_fee.toLocaleString()} {t.doctors.currency}
              </p>
            )}
          </div>
        </div>

        {/* Bio */}
        {bio && (
          <p className="text-xs text-gray-500 leading-relaxed mt-3 line-clamp-2">{bio}</p>
        )}

        {/* Branch badges */}
        {isMultiLocation && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {uniqueBranches.map((b) => (
              <span
                key={b.id}
                className="inline-flex items-center gap-1 text-xs bg-[#FFF3C7] text-[#9A6A16] px-2 py-0.5 rounded-full border border-[#D8A83E]/30"
              >
                <MapPin className="w-3 h-3" />
                {lang === 'ar' ? (b as any).name_ar || b.name_en : b.name_en}
              </span>
            ))}
          </div>
        )}

        {/* Schedule preview */}
        <div className="mt-3 space-y-1 flex-1">
          {doctor.schedules.slice(0, 3).map((s, i) => (
            <div key={i} className="flex items-center gap-1.5 text-xs text-gray-500">
              <Clock className="w-3 h-3 flex-shrink-0 text-[#9A6A16]" />
              <span>
                {t.dayNames[s.day_of_week]}
                {' · '}
                {s.start_time.slice(0, 5)} – {s.end_time.slice(0, 5)}
                {isMultiLocation && (
                  <span className="text-gray-400">
                    {' · '}
                    {lang === 'ar' ? (s.branches as any).name_ar || s.branches.name_en : s.branches.name_en}
                  </span>
                )}
              </span>
            </div>
          ))}
          {doctor.schedules.length > 3 && (
            <p className="text-xs text-gray-400">
              +{doctor.schedules.length - 3} {t.doctors.moreSessions}
            </p>
          )}
        </div>

        {/* CTA */}
        <div className="mt-5">
          <Link href={`/book?doctor=${doctor.id}`}>
            <Button className="w-full bg-[#101010] hover:bg-black text-white" size="sm">
              {t.doctors.bookWith}{' '}
              {doctor.name_en.split(' ').slice(0, 2).join(' ')}
              <ChevronRight className={`w-4 h-4 ${lang === 'ar' ? 'rotate-180 me-1' : 'ms-1'}`} />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
