import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { PageHeader } from "@/components/custom/PageHeader"
import { AnnouncementsList } from "@/components/custom/AnnouncementsList"

export const metadata = {
  title: "Announcements - Employee | InnoVibe TMS",
}

export default async function EmployeeAnnouncementsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const { data: announcements } = await supabase
    .from('announcements')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-8">
      <PageHeader 
        title="Announcements" 
        subtitle="Stay updated with the latest news and broadcasts from your company."
      />

      <div className="pt-2">
        <AnnouncementsList announcements={announcements || []} viewerRole="EMPLOYEE" />
      </div>
    </div>
  )
}
