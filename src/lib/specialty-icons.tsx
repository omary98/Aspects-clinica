import {
  Activity,
  Baby,
  Bone,
  Brain,
  Dumbbell,
  Ear,
  Eye,
  FlaskConical,
  HeartPulse,
  Microscope,
  Scan,
  Scissors,
  ShieldPlus,
  Smile,
  Sparkles,
  Stethoscope,
  Syringe,
  Utensils,
  Waves,
  Zap,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export const SPECIALTY_ICON_OPTIONS = [
  { value: 'scissors', label: 'Surgery', Icon: Scissors },
  { value: 'stethoscope', label: 'Clinical Care', Icon: Stethoscope },
  { value: 'sparkles', label: 'Aesthetics', Icon: Sparkles },
  { value: 'zap', label: 'Laser', Icon: Zap },
  { value: 'smile', label: 'Dentistry', Icon: Smile },
  { value: 'heart-pulse', label: 'Heart & Vascular', Icon: HeartPulse },
  { value: 'baby', label: 'Pediatrics', Icon: Baby },
  { value: 'ear', label: 'ENT', Icon: Ear },
  { value: 'dumbbell', label: 'Physiotherapy', Icon: Dumbbell },
  { value: 'brain', label: 'Neurosurgery', Icon: Brain },
  { value: 'scan', label: 'Imaging', Icon: Scan },
  { value: 'flask-conical', label: 'Laboratory', Icon: FlaskConical },
  { value: 'microscope', label: 'Oncology', Icon: Microscope },
  { value: 'bone', label: 'Orthopedics', Icon: Bone },
  { value: 'syringe', label: 'Injectables', Icon: Syringe },
  { value: 'waves', label: 'Ultrasound / Hydrafacial', Icon: Waves },
  { value: 'utensils', label: 'Nutrition', Icon: Utensils },
  { value: 'eye', label: 'Eye Care', Icon: Eye },
  { value: 'shield-plus', label: 'Anesthesia / Safety', Icon: ShieldPlus },
  { value: 'activity', label: 'Medical Activity', Icon: Activity },
] as const

const ICON_MAP = SPECIALTY_ICON_OPTIONS.reduce<Record<string, LucideIcon>>((acc, option) => {
  acc[option.value] = option.Icon
  return acc
}, {})

function normalizeIconName(value: string | null | undefined) {
  return String(value || '')
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/_/g, '-')
    .toLowerCase()
}

export function getSpecialtyIcon(icon: string | null | undefined): LucideIcon {
  return ICON_MAP[normalizeIconName(icon)] || Stethoscope
}

export function SpecialtyIcon({
  icon,
  className,
}: {
  icon: string | null | undefined
  className?: string
}) {
  const Icon = getSpecialtyIcon(icon)
  return <Icon className={cn('h-5 w-5', className)} />
}
