import { createClient } from "@/lib/supabase/server"
import { createClient as createAdminClient } from "@supabase/supabase-js"
import { redirect } from "next/navigation"
import { PageHeader } from "@/components/custom/PageHeader"
import { UserAvatar } from "@/components/custom/UserAvatar"
import { Card } from "@/components/ui/card"
import { Settings, UserCircle, Building2, Hash, Briefcase } from "lucide-react"
import Link from "next/link"

export const metadata = {
  title: "Profile | Employee",
}

export default async function EmployeeProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  // Use service role client to bypass RLS
  const adminSupabase = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // First try by auth user ID (primary link)
  let { data: emp } = await adminSupabase
    .from('employees')
    .select('*, departments(department_name)')
    .eq('id', user!.id)
    .maybeSingle()

  // Fallback: try by email (handles edge cases)
  if (!emp && user?.email) {
    const { data: empByEmail } = await adminSupabase
      .from('employees')
      .select('*, departments(department_name)')
      .eq('employee_email', user.email)
      .maybeSingle()
    emp = empByEmail
  }

  if (!emp) return (
    <div className="p-8 text-center text-slate-500">
      <p className="font-semibold">Employee profile not found.</p>
      <p className="text-sm mt-1">Your account ({user?.email}) is not linked to an employee record.</p>
    </div>
  )

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <PageHeader 
          title="My Profile" 
          description="View your personal and organizational details."
        />
        <Link 
          href="/employee/settings"
          className="w-12 h-12 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-500 hover:text-[#0066FF] hover:border-[#0066FF] hover:bg-blue-50 transition-all"
          title="Settings"
        >
          <Settings className="w-5 h-5" />
        </Link>
      </div>

      <Card className="p-8 rounded-2xl bg-white shadow-sm border-slate-200">
        <div className="flex flex-col md:flex-row gap-8 items-start">
          <div className="flex-shrink-0">
            <UserAvatar 
              url={emp.profile_photo} 
              name={emp.employee_name} 
              className="w-32 h-32 rounded-3xl text-4xl shadow-md"
            />
          </div>
          <div className="flex-1 space-y-6">
            <div>
              <h2 className="text-3xl font-black text-slate-900 mb-1">{emp.employee_name}</h2>
              <div className="flex items-center gap-2 text-[#0066FF] font-medium bg-blue-50 w-max px-3 py-1 rounded-full text-sm">
                <Briefcase className="w-4 h-4" />
                Employee
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
              <div>
                <p className="text-sm font-semibold text-slate-500 flex items-center gap-1.5 mb-1">
                  <Hash className="w-4 h-4" /> Employee ID
                </p>
                <p className="text-lg font-bold text-slate-900">{emp.employee_code}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-500 flex items-center gap-1.5 mb-1">
                  <Building2 className="w-4 h-4" /> Department
                </p>
                <p className="text-lg font-bold text-slate-900">{emp.departments?.department_name || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-500 flex items-center gap-1.5 mb-1">
                  <UserCircle className="w-4 h-4" /> Role
                </p>
                <p className="text-lg font-bold text-slate-900">{emp.designation}</p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
