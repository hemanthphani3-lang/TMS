import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { PageHeader } from "@/components/custom/PageHeader"
import { AnnouncementsList } from "@/components/custom/AnnouncementsList"
import { DepartmentBroadcastForm } from "@/components/department/DepartmentBroadcastForm"

export const metadata = {
  title: "Announcements - Department | InnoVibe TMS",
}

export default async function DepartmentAnnouncementsPage() {
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
        subtitle="View organization announcements and broadcast messages to your employees."
      />
      
      <DepartmentBroadcastForm />

      <div className="pt-8">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Announcement History</h2>
        <AnnouncementsList announcements={announcements || []} viewerRole="DEPARTMENT" />
      </div>
    </div>
  )
}
