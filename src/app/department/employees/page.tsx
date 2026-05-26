import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { PageHeader } from "@/components/custom/PageHeader"
import { EmployeeCard } from "@/components/custom/EmployeeCard"
import Link from "next/link"
import { Plus } from "lucide-react"

export default async function DepartmentEmployeesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // RLS ensures the department can only fetch their own employees
  const { data: employees } = await supabase
    .from('employees')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        <PageHeader 
          title="Employees" 
          description="Manage workforce accounts within your department."
          action={
            <Link 
              href="/department/employees/create" 
              className="flex items-center gap-2 bg-[#0066FF] hover:bg-[#0052CC] text-white px-4 py-2.5 rounded-xl font-medium transition-colors shadow-sm shadow-[#0066FF]/20"
            >
              <Plus className="w-4 h-4" />
              <span>Add Employee</span>
            </Link>
          }
        />

        {employees?.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No employees found</h3>
            <p className="text-slate-500 mb-6 max-w-sm mx-auto">Get started by creating your first employee account to grant them access to the platform.</p>
            <Link 
              href="/department/employees/create" 
              className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Create Employee</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {employees?.map((emp) => (
              <EmployeeCard
                key={emp.id}
                id={emp.id}
                name={emp.employee_name}
                code={emp.employee_code}
                email={emp.employee_email}
                designation={emp.designation}
                phone={emp.phone_number}
                status={emp.account_status}
                photo={emp.profile_photo}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
