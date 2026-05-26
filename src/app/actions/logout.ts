"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function requestLogoutAndSubmitWork(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Unauthorized" }

  const comment = formData.get('work_comment') as string
  const file = formData.get('attachment') as File

  if (!comment && (!file || file.size === 0)) {
    return { success: false, error: "You must provide either a comment or upload a file representing your work." }
  }

  // Get employee data to get department_id
  const { data: employee } = await supabase
    .from('employees')
    .select('department_id')
    .eq('id', user.id)
    .single()

  if (!employee) return { success: false, error: "Employee not found." }

  // Get today's attendance record (IST-aware)
  const now = new Date()
  const istOffset = 5.5 * 60 * 60 * 1000
  const todayIST = new Date(now.getTime() + istOffset).toISOString().split('T')[0]
  const startUTC = new Date(`${todayIST}T00:00:00+05:30`).toISOString()
  const endUTC = new Date(`${todayIST}T23:59:59+05:30`).toISOString()
  const today = todayIST

  const { data: attendances } = await supabase
    .from('attendance')
    .select('id, check_in_time, work_status')
    .eq('employee_id', user.id)
    .gte('created_at', startUTC)
    .lte('created_at', endUTC)
    .order('created_at', { ascending: false })
    .limit(1)

  const attendance = attendances?.[0]

  if (!attendance) {
    return { success: false, error: "You have not checked in today." }
  }

  if (attendance.work_status === 'LOGGED_OUT') {
    return { success: false, error: "You are already logged out." }
  }

  if (attendance.work_status === 'LOGOUT_REQUESTED') {
    return { success: false, error: "A logout request is already pending. Please wait for your department to approve." }
  }

  // Handle File Upload
  let fileUrl = null
  let fileType = null

  if (file && file.size > 0) {
    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}/${Date.now()}.${fileExt}`
    
    const { error: uploadError } = await supabase.storage
      .from('daily-work-submissions')
      .upload(fileName, file)

    if (uploadError) return { success: false, error: uploadError.message }

    const { data: { publicUrl } } = supabase.storage
      .from('daily-work-submissions')
      .getPublicUrl(fileName)

    fileUrl = publicUrl
    fileType = file.type || 'application/octet-stream'
  }

  // Create Logout Request
  const { data: logoutRequest, error: lrError } = await supabase
    .from('logout_requests')
    .insert({
      employee_id: user.id,
      department_id: employee.department_id,
      attendance_date: today,
      approval_status: 'PENDING'
    })
    .select()
    .single()

  if (lrError) return { success: false, error: lrError.message }

  // Create Work Submission
  const { error: wsError } = await supabase
    .from('work_submissions')
    .insert({
      logout_request_id: logoutRequest.id,
      employee_id: user.id,
      department_id: employee.department_id,
      work_comment: comment || null,
      attachment_url: fileUrl,
      attachment_type: fileType
    })

  if (wsError) return { success: false, error: wsError.message }

  // Update Attendance Status
  await supabase
    .from('attendance')
    .update({ work_status: 'LOGOUT_REQUESTED' })
    .eq('id', attendance.id)

  revalidatePath('/employee/dashboard')
  return { success: true }
}

export async function approveLogout(requestId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Unauthorized" }

  // Get request details
  const { data: request } = await supabase
    .from('logout_requests')
    .select('*, employees(department_id)')
    .eq('id', requestId)
    .single()

  if (!request) return { success: false, error: "Request not found" }

  // Get attendance (IST-aware)
  const attStart = new Date(`${request.attendance_date}T00:00:00+05:30`).toISOString()
  const attEnd = new Date(`${request.attendance_date}T23:59:59+05:30`).toISOString()
  const { data: attendance } = await supabase
    .from('attendance')
    .select('id, check_in_time')
    .eq('employee_id', request.employee_id)
    .gte('created_at', attStart)
    .lte('created_at', attEnd)
    .maybeSingle()

  // Use the time the employee REQUESTED the logout, not the time it was approved!
  const requestDate = new Date(request.created_at)
  const approvalDate = new Date() // Time manager actually clicks approve
  
  const logoutTime = requestDate.toLocaleTimeString('en-US', { hour12: false })
  
  let workingHoursText = "Unknown"
  if (attendance && attendance.check_in_time) {
    const inDate = new Date(attendance.check_in_time)
    const diffMs = requestDate.getTime() - inDate.getTime()
    
    // Ensure we don't get negative times if clocks are slightly out of sync
    const totalMins = Math.max(0, Math.floor(diffMs / 60000))
    
    const h = Math.floor(totalMins / 60)
    const m = totalMins % 60
    workingHoursText = `${h}h ${m}m`
  }

  // Update request
  const { error } = await supabase
    .from('logout_requests')
    .update({
      approval_status: 'APPROVED',
      approved_by_department: user.id,
      approval_time: approvalDate.toISOString(),
      logout_time: requestDate.toISOString(), // Real logout time
      total_working_hours: workingHoursText
    })
    .eq('id', requestId)

  if (error) return { success: false, error: error.message }

  // Update attendance
  if (attendance) {
    await supabase
      .from('attendance')
      .update({
        logout_time: logoutTime,
        working_hours: workingHoursText,
        work_status: 'LOGGED_OUT'
      })
      .eq('id', attendance.id)
  }

  revalidatePath('/department/logouts')
  return { success: true }
}

export async function rejectLogout(requestId: string, reason: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Unauthorized" }

  // Get request details
  const { data: request } = await supabase
    .from('logout_requests')
    .select('employee_id, attendance_date')
    .eq('id', requestId)
    .single()

  const { error } = await supabase
    .from('logout_requests')
    .update({
      approval_status: 'REJECTED',
      approved_by_department: user.id,
      approval_time: new Date().toISOString(),
      rejection_reason: reason
    })
    .eq('id', requestId)

  if (error) return { success: false, error: error.message }

  if (request) {
    // Revert attendance to ACTIVE (IST-aware)
    const revertStart = new Date(`${request.attendance_date}T00:00:00+05:30`).toISOString()
    const revertEnd = new Date(`${request.attendance_date}T23:59:59+05:30`).toISOString()
    await supabase
      .from('attendance')
      .update({ work_status: 'ACTIVE' })
      .eq('employee_id', request.employee_id)
      .gte('created_at', revertStart)
      .lte('created_at', revertEnd)
  }

  revalidatePath('/department/logouts')
  return { success: true }
}
