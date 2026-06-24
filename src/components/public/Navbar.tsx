'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Menu, X, Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/components/LanguageProvider'

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { t, lang, toggleLang } = useLanguage()

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
            <div className="w-8 h-8 rounded-full bg-[#1B4F72] flex items-center justify-center">
              <span className="text-white font-bold text-sm">EC</span>
            </div>
            <span className="font-bold text-xl text-[#1B4F72]">EuroCure</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-gray-600 hover:text-[#1B4F72] transition-colors"
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
              className="hidden md:flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-[#1B4F72] transition-colors border border-gray-200 hover:border-[#1B4F72]/40 rounded-full px-3 py-1.5"
              title={lang === 'ar' ? 'Switch to English' : 'التبديل إلى العربية'}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>{lang === 'ar' ? 'EN' : 'ع'}</span>
            </button>

            <Link href="/book">
              <Button size="sm" className="bg-[#1B4F72] hover:bg-[#154360] text-white">
                {t.nav.bookNow}
              </Button>
            </Link>

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
              className="block text-sm text-gray-700 hover:text-[#1B4F72] py-1"
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <div className="flex gap-2 pt-2">
            <Link href="/book" className="flex-1" onClick={() => setMobileOpen(false)}>
              <Button size="sm" className="w-full bg-[#1B4F72] hover:bg-[#154360] text-white">
                {t.nav.bookNow}
              </Button>
            </Link>
            <button
              onClick={() => { toggleLang(); setMobileOpen(false) }}
              className="flex items-center gap-1.5 text-xs font-medium text-gray-500 border border-gray-200 rounded-lg px-3 py-2"
            >
              <Globe className="w-3.5 h-3.5" />
              {lang === 'ar' ? 'EN' : 'ع'}
            </button>
          </div>
        </div>
      )}
    </header>
  )
}
