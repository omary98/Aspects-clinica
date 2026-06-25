'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Menu, X, Globe, Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/components/LanguageProvider'
import { useTheme } from '@/components/ThemeProvider'

export default function Navbar({
  logoUrl,
  logoUrlDark,
}: {
  logoUrl?: string | null
  logoUrlDark?: string | null
}) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { t, lang, toggleLang } = useLanguage()
  const { theme, toggleTheme } = useTheme()
  const currentLogoUrl = theme === 'dark' ? (logoUrlDark || logoUrl) : logoUrl
  const brandName = lang === 'ar' ? 'يوروكيور' : 'EuroCure'

  const navLinks = [
    { href: '/#specialties', label: t.nav.specialties },
    { href: '/#doctors', label: t.nav.doctors },
    { href: '/#locations', label: t.nav.locations },
    { href: '/#contact', label: t.nav.contact },
  ]

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            {currentLogoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={currentLogoUrl} alt="EuroCure" className="w-8 h-8 rounded-full object-cover" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-[#101010] flex items-center justify-center">
                <span className="text-[#D8A83E] font-bold text-sm">EC</span>
              </div>
            )}
            <span className="eurocure-wordmark eurocure-nav-wordmark text-2xl font-bold text-[#101010]">{brandName}</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-gray-600 hover:text-[#9A6A16] transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* Language toggle */}
            <button
              onClick={toggleLang}
              className="hidden md:flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-[#9A6A16] transition-colors border border-gray-200 hover:border-[#D8A83E]/60 rounded-full px-3 py-1.5"
              title={lang === 'ar' ? 'Switch to English' : 'التبديل إلى العربية'}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>{lang === 'ar' ? 'EN' : 'عربي'}</span>
            </button>

            <button
              onClick={toggleTheme}
              className="hidden md:flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition-colors hover:border-[#D8A83E]/60 hover:text-[#9A6A16] dark:border-white/15 dark:text-white/70 dark:hover:text-[#F7D775]"
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </button>

            <Link href="/book">
              <Button size="sm" className="eurocure-nav-cta bg-[#101010] hover:bg-black text-white">
                {t.nav.bookNow}
              </Button>
            </Link>

            <button
              onClick={toggleTheme}
              className="flex md:hidden h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition-colors hover:border-[#D8A83E]/60 hover:text-[#9A6A16]"
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Mobile menu toggle */}
            <button
              className="md:hidden p-2 text-gray-600"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t bg-white px-4 py-4 space-y-3">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block text-sm text-gray-700 hover:text-[#9A6A16] py-1"
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <div className="flex gap-2 pt-2">
            <Link href="/book" className="flex-1" onClick={() => setMobileOpen(false)}>
              <Button size="sm" className="w-full bg-[#101010] hover:bg-black text-white">
                {t.nav.bookNow}
              </Button>
            </Link>
            <button
              onClick={() => { toggleLang(); setMobileOpen(false) }}
              className="flex items-center gap-1.5 text-xs font-medium text-gray-500 border border-gray-200 rounded-lg px-3 py-2"
            >
              <Globe className="w-3.5 h-3.5" />
              {lang === 'ar' ? 'EN' : 'عربي'}
            </button>
            <button
              onClick={() => { toggleTheme(); setMobileOpen(false) }}
              className="flex items-center gap-1.5 text-xs font-medium text-gray-500 border border-gray-200 rounded-lg px-3 py-2 dark:border-white/15 dark:text-white/70"
            >
              {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
              {theme === 'dark' ? 'Light' : 'Dark'}
            </button>
          </div>
        </div>
      )}
    </header>
  )
}
