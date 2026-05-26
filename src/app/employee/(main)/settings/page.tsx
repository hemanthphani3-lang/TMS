import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { PageHeader } from "@/components/custom/PageHeader"
import { PasswordChangeForm } from "@/components/settings/PasswordChangeForm"

export const metadata = {
  title: "Settings | Employee",
}

export default async function EmployeeSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const { data: emp } = await supabase
    .from('employees')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-8">
      <PageHeader 
        title="Account Settings" 
        description="Manage your personal account settings and security."
      />

      <div className="grid grid-cols-1 gap-8">
        <PasswordChangeForm />
      </div>
    </div>
  )
}
