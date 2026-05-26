import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { PageHeader } from "@/components/custom/PageHeader"
import { BroadcastForm } from "@/components/admin/BroadcastForm"

export const metadata = {
  title: "Announcements - Admin | InnoVibe TMS",
}

export default async function AdminAnnouncementsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-8">
      <PageHeader 
        title="Announcements" 
        subtitle="Broadcast important messages to your departments and employees."
      />
      <BroadcastForm />
    </div>
  )
}
