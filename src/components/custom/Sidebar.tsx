"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion } from "framer-motion"
import { LogOut, LayoutDashboard, Building2, Users, User, Calendar, ListTodo } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import Image from "next/image"

const iconMap: Record<string, React.ElementType> = {
  dashboard: LayoutDashboard,
  departments: Building2,
  employees: Users,
  identity: User,
  calendar: Calendar,
  tasks: ListTodo,
}

interface SidebarProps {
  title: string
  links: { label: string; href: string; iconName: string; badgeCount?: number }[]
  onLogoutClick?: () => void
}

export function Sidebar({ title, links, onLogoutClick }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    if (onLogoutClick) {
      onLogoutClick()
    } else {
      await supabase.auth.signOut()
      router.push("/login")
      router.refresh()
    }
  }

  return (
    <aside className="fixed inset-y-0 left-0 w-64 bg-white border-r border-slate-200 z-50 flex flex-col hidden md:flex">
      {/* Logo & Title */}
      <div className="p-6 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <Image src="/logo.png" alt="InnoVibe" width={32} height={32} className="w-8 h-8 object-contain" />
          <div className="flex flex-col">
            <span className="font-bold text-[#0A1A2F] text-lg leading-tight">InnoVibe</span>
            <span className="text-[10px] uppercase font-bold tracking-widest text-[#0066FF]">{title}</span>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
        {links.map((link) => {
          const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`)
          const Icon = iconMap[link.iconName] || LayoutDashboard

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                isActive 
                  ? "text-[#0066FF] bg-blue-50 font-semibold" 
                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-50 font-medium"
              }`}
            >
              <Icon className={`w-5 h-5 transition-colors ${isActive ? "text-[#0066FF]" : "text-slate-400 group-hover:text-slate-600"}`} />
              <span className="flex-1">{link.label}</span>
              
              {link.badgeCount !== undefined && link.badgeCount > 0 && (
                <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                  {link.badgeCount}
                </span>
              )}
              
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute inset-0 bg-blue-50 rounded-xl -z-10"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
            </Link>
          )
        })}
      </div>

      {/* Logout Button */}
      <div className="p-4 border-t border-slate-100">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-slate-500 hover:text-red-600 hover:bg-red-50 font-medium transition-all duration-200"
        >
          <LogOut className="w-5 h-5 text-slate-400 hover:text-red-500 transition-colors" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  )
}
