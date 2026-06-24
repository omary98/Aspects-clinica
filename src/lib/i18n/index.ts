export type Lang = 'ar' | 'en'

export const LANG_COOKIE = 'eurocure_lang'
export const DEFAULT_LANG: Lang = 'ar'

export interface Translations {
  dir: 'rtl' | 'ltr'
  nav: {
    specialties: string
    doctors: string
    locations: string
    contact: string
    bookNow: string
    adminLogin: string
  }
  hero: {
    tagline: string
    title: string
    titleHighlight: string
    subtitle: string
    bookCta: string
    viewSpecialties: string
    verified: string
    instant: string
    multiLocation: string
  }
  specialties: {
    sectionTitle: string
    sectionSubtitle: string
    viewDoctors: string
    bookIn: string
  }
  doctors: {
    sectionTitle: string
    bookWith: string
    moreSessions: string
    consultation: string
    currency: string
    availableAt: string
  }
  locations: {
    sectionTitle: string
    sectionSubtitle: string
    viewOnMaps: string
    mainBranch: string
    doctorSpecific: string
  }
  cta: {
    title: string
    subtitle: string
    bookNow: string
  }
  footer: {
    tagline: string
    quickLinks: string
    rights: string
    adminLogin: string
  }
  booking: {
    pageTitle: string
    pageSubtitle: string
    steps: {
      select: string
      datetime: string
      details: string
      review: string
    }
    step1: {
      title: string
      specialty: string
      selectSpecialty: string
      doctor: string
      selectDoctor: string
      branch: string
      selectBranch: string
      service: string
      serviceOptional: string
      selectService: string
      generalConsultation: string
      continue: string
    }
    step2: {
      title: string
      changeDoctor: string
      selectedLocation: string
      date: string
      chooseDate: string
      noAvailableDates: string
      slots: string
      sameDayCutoff: string
      loadingSlots: string
      noSlots: string
      back: string
      continue: string
    }
    step3: {
      title: string
      fullName: string
      namePlaceholder: string
      age: string
      agePlaceholder: string
      patientType: string
      newPatient: string
      followUp: string
      phone: string
      phonePlaceholder: string
      email: string
      emailNote: string
      complaint: string
      complaintPlaceholder: string
      referral: string
      notes: string
      notesOptional: string
      notesPlaceholder: string
      back: string
      reviewBooking: string
    }
    step4: {
      title: string
      appointmentDetails: string
      patientInfo: string
      doctor: string
      specialty: string
      location: string
      service: string
      date: string
      time: string
      name: string
      phoneLabel: string
      emailLabel: string
      type: string
      referralLabel: string
      complaint: string
      back: string
      confirm: string
      confirming: string
      policy: string
      newPatient: string
      followUp: string
    }
    errors: {
      notAvailable: string
      network: string
      generic: string
    }
  }
  confirmation: {
    title: string
    subtitle: string
    emailSent: string
    reference: string
    doctor: string
    date: string
    time: string
    location: string
    address: string
    phone: string
    important: {
      title: string
      arrive: string
      bringRecords: string
      cancel: string
    }
    backHome: string
    bookAnother: string
    notFound: string
    bookAgain: string
  }
  referralSources: string[]
  statusLabels: Record<string, string>
  dayNames: string[]
  common: {
    loading: string
    back: string
    continue: string
    cancel: string
    save: string
    close: string
    noticeHours: string
  }
}

import { ar } from './ar'
import { en } from './en'

export const translations: Record<Lang, Translations> = { ar, en }

export function getT(lang: Lang): Translations {
  return translations[lang]
}
