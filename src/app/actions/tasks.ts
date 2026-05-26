"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

// ==========================================
// TASK CREATION (Department Only)
// ==========================================
export async function createTask(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Unauthorized" }

  const title = formData.get('title') as string
  const description = formData.get('description') as string
  const assigned_employee_id = formData.get('assigned_employee_id') as string
  const priority = formData.get('priority') as string
  const due_date = formData.get('due_date') as string
  const estimated_time = formData.get('estimated_time') as string

  if (!title || !description || !assigned_employee_id || !due_date) {
    redirect(`/department/tasks/create?error=${encodeURIComponent("Missing required fields")}`)
  }

  // Security Check: Verify the assigned employee belongs to this department
  const { data: employee } = await supabase
    .from('employees')
    .select('department_id')
    .eq('id', assigned_employee_id)
    .single()

  if (!employee || employee.department_id !== user.id) {
    redirect(`/department/tasks/create?error=${encodeURIComponent("You can only assign tasks to employees within your department.")}`)
  }

  // Create Task
  const { data: task, error } = await supabase
    .from('tasks')
    .insert({
      task_title: title,
      task_description: description,
      assigned_by_department: user.id,
      department_id: user.id,
      assigned_employee_id,
      priority_level: priority || 'MEDIUM',
      due_date,
      estimated_completion_time: estimated_time || null
    })
    .select()
    .single()

  if (error) {
    redirect(`/department/tasks/create?error=${encodeURIComponent(error.message)}`)
  }

  // Handle Attachments
  const rawFiles = formData.getAll('attachments') as File[]
  const files = rawFiles.filter(f => f.size > 0 && f.name)

  for (const file of files) {
    const fileExt = file.name.split('.').pop()
    const fileName = `${task.id}-${Math.random()}.${fileExt}`
    
    const { error: uploadError } = await supabase.storage
      .from('task-attachments')
      .upload(fileName, file)

    if (!uploadError) {
      const { data: { publicUrl } } = supabase.storage
        .from('task-attachments')
        .getPublicUrl(fileName)
      
      await supabase.from('task_attachments').insert({
        task_id: task.id,
        uploaded_by: user.id,
        file_url: publicUrl,
        file_type: file.type || 'application/octet-stream'
      })
    }
  }

  // Log Activity
  await supabase.from('task_activity_logs').insert({
    task_id: task.id,
    action_type: 'CREATED',
    action_by: user.id,
    action_description: `Task was created and assigned${files.length > 0 ? ` with ${files.length} attachment(s)` : ''}.`
  })

  // Notify the assigned employee
  await supabase.from('notifications').insert({
    user_id: assigned_employee_id,
    title: 'New Task Assigned',
    message: `You have been assigned a new task: ${title}`,
    type: 'TASK',
    link_url: `/employee/tasks/${task.id}`
  })

  revalidatePath('/department/tasks')
  redirect('/department/tasks')
}

// ==========================================
// TASK STATUS UPDATES
// ==========================================
export async function updateTaskStatus(taskId: string, newStatus: string, reopenReason?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Unauthorized" }

  const { error } = await supabase
    .from('tasks')
    .update({ 
      task_status: newStatus,
      reopen_reason: reopenReason || null,
      updated_at: new Date().toISOString()
    })
    .eq('id', taskId)

  if (error) return { success: false, error: error.message }

  // Log Activity
  await supabase.from('task_activity_logs').insert({
    task_id: taskId,
    action_type: 'STATUS_CHANGE',
    action_by: user.id,
    action_description: `Status changed to ${newStatus}${reopenReason ? ` (Reason: ${reopenReason})` : ''}`
  })

  // We revalidate paths that might display this task
  revalidatePath('/department/tasks')
  revalidatePath('/employee/tasks')
  revalidatePath(`/department/tasks/${taskId}`)
  revalidatePath(`/employee/tasks/${taskId}`)
  return { success: true }
}

// ==========================================
// COMMENTS
// ==========================================
export async function addComment(taskId: string, comment: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Unauthorized" }

  const { error } = await supabase
    .from('task_comments')
    .insert({
      task_id: taskId,
      user_id: user.id,
      comment_text: comment
    })

  if (error) return { success: false, error: error.message }

  // Log Activity
  await supabase.from('task_activity_logs').insert({
    task_id: taskId,
    action_type: 'COMMENT_ADDED',
    action_by: user.id,
    action_description: 'Added a new comment.'
  })

  // We don't necessarily need to revalidate path if we use Realtime or Optimistic UI
  // but it's safe to include it.
  return { success: true }
}

// ==========================================
// ATTACHMENTS
// ==========================================
export async function addTaskAttachment(taskId: string, fileUrl: string, fileType: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Unauthorized" }

  const { error } = await supabase
    .from('task_attachments')
    .insert({
      task_id: taskId,
      uploaded_by: user.id,
      file_url: fileUrl,
      file_type: fileType
    })

  if (error) return { success: false, error: error.message }

  // Log Activity
  await supabase.from('task_activity_logs').insert({
    task_id: taskId,
    action_type: 'ATTACHMENT_ADDED',
    action_by: user.id,
    action_description: 'Uploaded a new file attachment.'
  })

  return { success: true }
}

// ==========================================
// TASK CREATION (Admin Only)
// ==========================================
export async function createAdminTask(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Unauthorized" }

  const title = formData.get('title') as string
  const description = formData.get('description') as string
  const assigned_employee_id = formData.get('assigned_employee_id') as string
  const department_id = formData.get('department_id') as string
  const priority = formData.get('priority') as string
  const due_date = formData.get('due_date') as string
  const estimated_time = formData.get('estimated_time') as string

  if (!title || !description || !assigned_employee_id || !due_date || !department_id) {
    return { success: false, error: "Missing required fields" }
  }

  // Create Task
  // Admin assigns task to the employee's department, so the department sees it too.
  const { data: task, error } = await supabase
    .from('tasks')
    .insert({
      task_title: title,
      task_description: description,
      assigned_by_department: department_id, // We link it to the employee's department
      department_id: department_id,
      assigned_employee_id,
      priority_level: priority || 'MEDIUM',
      due_date,
      estimated_completion_time: estimated_time || null
    })
    .select()
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  // Handle Attachments
  const rawFiles = formData.getAll('attachments') as File[]
  const files = rawFiles.filter(f => f.size > 0 && f.name)

  for (const file of files) {
    const fileExt = file.name.split('.').pop()
    const fileName = `${task.id}-${Math.random()}.${fileExt}`
    
    const { error: uploadError } = await supabase.storage
      .from('task-attachments')
      .upload(fileName, file)

    if (!uploadError) {
      const { data: { publicUrl } } = supabase.storage
        .from('task-attachments')
        .getPublicUrl(fileName)
      
      await supabase.from('task_attachments').insert({
        task_id: task.id,
        uploaded_by: user.id, // Admin ID
        file_url: publicUrl,
        file_type: file.type || 'application/octet-stream'
      })
    }
  }

  // Log Activity
  await supabase.from('task_activity_logs').insert({
    task_id: task.id,
    action_type: 'CREATED',
    action_by: user.id, // Admin ID
    action_description: `Task was created and assigned by Admin${files.length > 0 ? ` with ${files.length} attachment(s)` : ''}.`
  })

  // Notify the assigned employee
  await supabase.from('notifications').insert({
    user_id: assigned_employee_id,
    title: 'New Task Assigned (Admin)',
    message: `You have been assigned a new task by an Administrator: ${title}`,
    type: 'TASK',
    link_url: `/employee/tasks/${task.id}`
  })

  revalidatePath('/admin/tasks')
  return { success: true }
}
