"use client"

import { LucideIcon } from "lucide-react"
import { motion } from "framer-motion"

interface AnalyticsCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  colorClass?: string
  bgClass?: string
  subtitle?: string
  delay?: number
}

export function AnalyticsCard({ 
  title, 
  value, 
  icon: Icon, 
  colorClass = "text-[#0066FF]",
  bgClass = "bg-blue-50",
  subtitle,
  delay = 0
}: AnalyticsCardProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: delay * 0.1, ease: "easeOut" }}
      className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-slate-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-shadow duration-300"
    >
      <div className="flex items-center gap-4 mb-4">
        <div className={`p-3 rounded-xl ${bgClass} ${colorClass}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-500">{title}</p>
          <h3 className="text-2xl font-black text-[#0A1A2F] tracking-tight">{value}</h3>
        </div>
      </div>
      {subtitle && (
        <p className="text-xs font-medium text-slate-400">{subtitle}</p>
      )}
    </motion.div>
  )
}
