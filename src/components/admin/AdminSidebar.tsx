'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  LayoutDashboard, Calendar, Users, Stethoscope, Building2,
  DoorOpen, ClipboardList, Clock, BanIcon, Settings,
  LogOut, ChevronRight, X, Menu, ImageIcon, FileText, Library, Home
} from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/appointments', label: 'Appointments', icon: Calendar },
  { section: 'Management' },
  { href: '/admin/doctors', label: 'Doctors', icon: Stethoscope },
  { href: '/admin/specialties', label: 'Specialties', icon: ClipboardList },
  { href: '/admin/branches', label: 'Branches', icon: Building2 },
  { href: '/admin/rooms', label: 'Rooms', icon: DoorOpen },
  { href: '/admin/services', label: 'Services', icon: ClipboardList },
  { href: '/admin/schedules', label: 'Schedules', icon: Clock },
  { href: '/admin/blocked-times', label: 'Blocked Times', icon: BanIcon },
  { section: 'Content' },
  { href: '/admin/branding', label: 'Branding', icon: ImageIcon },
  { href: '/admin/site-content', label: 'Site Content', icon: FileText },
  { href: '/admin/specialties-content', label: 'Specialties Content', icon: ClipboardList },
  { href: '/admin/media-library', label: 'Media Library', icon: Library },
  { section: 'System' },
  { href: '/admin/users', label: 'Admin Users', icon: Users },
  { href: '/admin/settings', label: 'Clinic Settings', icon: Settings },
]

interface AdminSidebarProps {
  adminName?: string
  adminRole?: string
}

export default function AdminSidebar({ adminName, adminRole }: AdminSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    await fetch('/api/admin/session', {
      method: 'DELETE',
      credentials: 'include',
    })
    router.push('/admin/login')
    router.refresh()
  }

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href
    return pathname.startsWith(href)
  }

  const renderSidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-5 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#123B67] flex items-center justify-center">
            <span className="text-[#BFEA1C] font-bold text-sm">AC</span>
          </div>
          <div>
            <p className="font-bold text-gray-900 text-sm">Aspects Clinica</p>
            <p className="text-xs text-gray-500">Admin Panel</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
        {navItems.map((item, i) => {
          if ('section' in item) {
            return (
              <p key={i} className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 py-2 mt-3 first:mt-0">
                {item.section}
              </p>
            )
          }
          const Icon = item.icon!
          const active = isActive(item.href!, item.exact)
          return (
            <Link
              key={item.href}
              href={item.href!}
              onClick={() => setMobileOpen(false)}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all',
                active
                  ? 'bg-[#1B4F72] text-white font-medium'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span>{item.label}</span>
              {active && <ChevronRight className="w-3.5 h-3.5 ml-auto" />}
            </Link>
          )
        })}
      </nav>

      {/* User & logout */}
      <div className="p-4 border-t border-gray-100">
        <Link
          href="/"
          onClick={() => setMobileOpen(false)}
          className="mb-3 flex items-center justify-center gap-2 rounded-lg border border-[#19B7C6]/40 bg-[#F4FBFA] px-3 py-2 text-sm font-medium text-[#0B8EA0] transition-colors hover:bg-[#19B7C6]/15"
        >
          <Home className="w-4 h-4" />
          Back to Website
        </Link>
        <div className="mb-3 px-1">
          <p className="text-sm font-medium text-gray-900 truncate">{adminName || 'Admin User'}</p>
          <p className="text-xs text-gray-400 capitalize">
            {adminRole?.replace('_', ' ') || 'Administrator'}
          </p>
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-red-600 transition-colors w-full px-1"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-60 bg-white border-r border-gray-100 h-screen sticky top-0 flex-shrink-0">
        {renderSidebarContent()}
      </aside>

      {/* Mobile top bar */}
      <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-white border-b sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-[#123B67] flex items-center justify-center">
            <span className="text-[#BFEA1C] font-bold text-xs">AC</span>
          </div>
          <span className="font-bold text-gray-900">Aspects Clinica Admin</span>
        </div>
        <button onClick={() => setMobileOpen(true)} className="p-2 text-gray-600">
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-60 bg-white h-full flex flex-col shadow-xl">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 p-1 text-gray-500"
            >
              <X className="w-5 h-5" />
            </button>
            {renderSidebarContent()}
          </aside>
        </div>
      )}
    </>
  )
}
