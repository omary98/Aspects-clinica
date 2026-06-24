'use client'

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { LANG_COOKIE, DEFAULT_LANG, getT, type Lang, type Translations } from '@/lib/i18n'

interface LanguageContextValue {
  lang: Lang
  t: Translations
  toggleLang: () => void
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

export function LanguageProvider({
  initialLang,
  children,
}: {
  initialLang: Lang
  children: ReactNode
}) {
  const [lang, setLang] = useState<Lang>(initialLang)
  const router = useRouter()

  const toggleLang = useCallback(() => {
    const next: Lang = lang === 'ar' ? 'en' : 'ar'
    document.cookie = `${LANG_COOKIE}=${next}; path=/; max-age=31536000; SameSite=Lax`
    setLang(next)
    router.refresh()
  }, [lang, router])

  return (
    <LanguageContext.Provider value={{ lang, t: getT(lang), toggleLang }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used inside LanguageProvider')
  return ctx
}
