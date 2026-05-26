import { Sidebar } from "@/components/custom/Sidebar"
import { LayoutDashboard, Building2 } from "lucide-react"

const adminLinks = [
  { label: "Dashboard", href: "/admin/dashboard", iconName: "dashboard" },
  { label: "Departments", href: "/admin/departments", iconName: "departments" },
  { label: "Holidays", href: "/admin/holidays", iconName: "calendar" },
  { label: "Reports", href: "/admin/reports", iconName: "file" },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Sidebar title="Admin Portal" links={adminLinks} />
      <div className="md:pl-64 flex flex-col min-h-screen transition-all duration-300">
        <main className="flex-1 w-full">
          {children}
        </main>
      </div>
    </div>
  )
}
