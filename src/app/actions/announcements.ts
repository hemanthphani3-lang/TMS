"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function broadcastAnnouncement(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Unauthorized" }

  const title = formData.get('title') as string
  const message = formData.get('message') as string
  const target = formData.get('target') as string // 'ALL', 'DEPARTMENTS', 'EMPLOYEES'

  if (!title || !message) {
    return { success: false, error: "Missing required fields" }
  }

  const notificationsToInsert = []

  // Fetch target users
  if (target === 'ALL' || target === 'DEPARTMENTS') {
    const { data: depts } = await supabase.from('departments').select('id')
    if (depts) {
      depts.forEach(d => {
        notificationsToInsert.push({
          user_id: d.id,
          title: `📣 ${title}`,
          message: message,
          type: 'ANNOUNCEMENT',
          link_url: '#'
        })
      })
    }
  }

  if (target === 'ALL' || target === 'EMPLOYEES') {
    const { data: emps } = await supabase.from('employees').select('id')
    if (emps) {
      emps.forEach(e => {
        notificationsToInsert.push({
          user_id: e.id,
          title: `📣 ${title}`,
          message: message,
          type: 'ANNOUNCEMENT',
          link_url: '#'
        })
      })
    }
  }

  if (notificationsToInsert.length > 0) {
    const { error } = await supabase.from('notifications').insert(notificationsToInsert)
    if (error) return { success: false, error: error.message }
  }

  revalidatePath('/admin/announcements')
  revalidatePath('/employee/notifications')
  revalidatePath('/department/notifications')
  
  return { success: true }
}
