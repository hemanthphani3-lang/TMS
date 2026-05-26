import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { PageHeader } from "@/components/custom/PageHeader"
import { ReportExportModal } from "@/components/reports/ReportExportModal"

export default async function AdminReportsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 sm:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <PageHeader 
          title="Export Reports" 
          description="Generate and download organizational data in PDF, Excel, or CSV formats."
        />
        
        <ReportExportModal role="ADMIN" />
      </div>
    </div>
  )
}
