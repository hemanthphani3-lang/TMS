import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ArrowLeft, Calendar, Clock, AlignLeft, CheckCircle2, RotateCcw } from "lucide-react"
import Link from "next/link"
import { TaskStatusBadge } from "@/components/tasks/TaskStatusBadge"
import { PriorityBadge } from "@/components/tasks/PriorityBadge"
import { updateTaskStatus } from "@/app/actions/tasks"
import { Button } from "@/components/ui/button"
import { TaskCommentBox } from "@/components/tasks/TaskCommentBox"

export default async function DepartmentTaskDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: taskId } = await params
  const supabase = await createClient()

  let user = null
  try {
    const { data } = await supabase.auth.getUser()
    user = data.user
  } catch (_e) {}

  if (!user) redirect('/login')

  // Fetch task, comments, and activity logs all in parallel
  const [
    { data: task },
    { data: comments },
    { data: logs }
  ] = await Promise.all([
    supabase
      .from('tasks')
      .select('*, employees!assigned_employee_id(*)')
      .eq('id', taskId)
      .eq('department_id', user!.id)
      .single(),
    supabase
      .from('task_comments')
      .select('*')
      .eq('task_id', taskId)
      .order('created_at', { ascending: true }),
    supabase
      .from('task_activity_logs')
      .select('*')
      .eq('task_id', taskId)
      .order('created_at', { ascending: false })
  ])

  if (!task) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-8">
        <div className="text-center">
          <h2 className="text-xl font-bold text-slate-900 mb-2">Task not found</h2>
          <p className="text-slate-500 mb-4">This task doesn&apos;t exist or you don&apos;t have permission to view it.</p>
          <Link href="/department/tasks" className="text-[#0066FF] font-medium hover:underline">← Back to Tasks</Link>
        </div>
      </div>
    )
  }

  const emp = task.employees as unknown as { employee_name: string, profile_photo: string | null, designation: string }

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        <Link href="/department/tasks" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Tasks
        </Link>

        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-black text-slate-900 mb-3">{task.task_title}</h1>
            <div className="flex flex-wrap items-center gap-4">
              <TaskStatusBadge status={task.task_status} />
              <PriorityBadge priority={task.priority_level} />
              <div className="flex items-center gap-1.5 text-sm font-medium text-slate-600 bg-white px-3 py-1.5 rounded-full border border-slate-200">
                <Calendar className="w-4 h-4 text-slate-400" />
                Due: {new Date(task.due_date).toLocaleDateString()}
              </div>
            </div>
          </div>

          {/* Department Approval/Reopen Actions */}
          {task.task_status === 'WAITING_APPROVAL' && (
            <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
              <form action={async () => {
                "use server"
                await updateTaskStatus(task.id, 'COMPLETED')
              }}>
                <Button type="submit" className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl px-6">
                  <CheckCircle2 className="w-4 h-4 mr-2" /> Approve as Complete
                </Button>
              </form>
              <form action={async () => {
                "use server"
                await updateTaskStatus(task.id, 'REOPENED', 'Work was rejected by department.')
              }}>
                <Button type="submit" variant="outline" className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 border-orange-200 rounded-xl px-6">
                  <RotateCcw className="w-4 h-4 mr-2" /> Reopen Task
                </Button>
              </form>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-100 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <AlignLeft className="w-5 h-5 text-slate-400" />
                <h3 className="font-bold text-slate-900 text-lg">Description</h3>
              </div>
              <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">
                {task.task_description}
              </p>
            </div>

            {/* Discussion / Comments */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-100 shadow-sm">
              <h3 className="font-bold text-slate-900 text-lg mb-6">Discussion</h3>
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 mb-4">
                {comments?.length === 0 && (
                  <p className="text-slate-500 text-center py-4">No comments yet. Start the conversation!</p>
                )}
                {comments?.map(comment => (
                  <div key={comment.id} className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-xs font-bold text-slate-400 mb-1">{new Date(comment.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</p>
                    <p className="text-slate-800 text-sm">{comment.comment_text}</p>
                  </div>
                ))}
              </div>
              <TaskCommentBox taskId={task.id} />
            </div>
          </div>

          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
              <h3 className="font-bold text-slate-900 mb-4">Assignee</h3>
              <div className="flex items-center gap-4">
                {emp?.profile_photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={emp.profile_photo} alt="" className="w-12 h-12 rounded-full object-cover" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-blue-100 text-[#0066FF] flex items-center justify-center text-lg font-bold">
                    {emp?.employee_name?.charAt(0) || '?'}
                  </div>
                )}
                <div>
                  <p className="font-semibold text-slate-900">{emp?.employee_name}</p>
                  <p className="text-sm text-slate-500">{emp?.designation}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
              <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400" />
                Activity Log
              </h3>
              {logs && logs.length > 0 ? (
                <div className="space-y-3">
                  {logs.map(log => (
                    <div key={log.id} className="p-3 rounded-lg border border-slate-100 bg-slate-50">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-slate-800 text-xs">{log.action_type.replace(/_/g, ' ')}</span>
                        <time className="text-[10px] text-slate-500">{new Date(log.created_at).toLocaleDateString()}</time>
                      </div>
                      <p className="text-xs text-slate-600">{log.action_description}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500 text-sm text-center py-4">No activity yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
