import type { Metadata } from 'next'
import { Cairo } from 'next/font/google'
import './globals.css'
import { getLang } from '@/lib/i18n/server'
import { LanguageProvider } from '@/components/LanguageProvider'

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  variable: '--font-cairo',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
})

export const metadata: Metadata = {
  title: 'يوروكيور — حجز مواعيد العيادة | EuroCure Polyclinic',
  description:
    'احجز موعدك في عيادة يوروكيور. متخصصون في الأشعة التداخلية والجراحة وأمراض الجلد والتجميل — مصر الجديدة، القاهرة.',
  keywords: 'EuroCure, يوروكيور, polyclinic, Nasr City, مصر الجديدة, interventional radiology, dermatology',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const lang = await getLang()
  const dir = lang === 'ar' ? 'rtl' : 'ltr'

  return (
    <html lang={lang} dir={dir} className={`h-full ${cairo.variable}`}>
      <body className="min-h-full flex flex-col antialiased">
        <LanguageProvider initialLang={lang}>
          {children}
        </LanguageProvider>
      </body>
    </html>
  )
}
