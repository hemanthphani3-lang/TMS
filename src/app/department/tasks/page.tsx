import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { PageHeader } from "@/components/custom/PageHeader"
import { Plus, ListTodo, Calendar, Search } from "lucide-react"
import Link from "next/link"
import { TaskStatusBadge } from "@/components/tasks/TaskStatusBadge"
import { PriorityBadge } from "@/components/tasks/PriorityBadge"

export default async function DepartmentTasksPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch tasks assigned by this department
  const { data: tasks } = await supabase
    .from('tasks')
    .select('*, employees!assigned_employee_id(employee_name, profile_photo)')
    .eq('department_id', user.id)
    .order('created_at', { ascending: false })

  const pendingCount = tasks?.filter(t => t.task_status !== 'COMPLETED').length || 0
  const completedCount = tasks?.filter(t => t.task_status === 'COMPLETED').length || 0
  const approvalCount = tasks?.filter(t => t.task_status === 'WAITING_APPROVAL').length || 0

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <PageHeader 
          title="Task Management" 
          description="Assign, track, and manage employee tasks across your department."
          action={
            <Link 
              href="/department/tasks/create" 
              className="flex items-center gap-2 bg-[#0066FF] hover:bg-[#0052CC] text-white px-4 py-2.5 rounded-xl font-medium transition-colors shadow-sm shadow-[#0066FF]/20"
            >
              <Plus className="w-4 h-4" />
              <span>Create Task</span>
            </Link>
          }
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex items-center justify-between group cursor-pointer hover:border-[#0066FF] transition-colors">
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">Active Tasks</p>
              <h4 className="text-3xl font-black text-slate-900">{pendingCount}</h4>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#0066FF] flex items-center justify-center group-hover:scale-110 transition-transform">
              <ListTodo className="w-6 h-6" />
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex items-center justify-between group cursor-pointer hover:border-emerald-500 transition-colors">
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">Completed</p>
              <h4 className="text-3xl font-black text-slate-900">{completedCount}</h4>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <ListTodo className="w-6 h-6" />
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex items-center justify-between group cursor-pointer hover:border-purple-500 transition-colors">
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">Pending Approval</p>
              <h4 className="text-3xl font-black text-slate-900">{approvalCount}</h4>
            </div>
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform relative">
              {approvalCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-purple-500"></span>
                </span>
              )}
              <ListTodo className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h3 className="font-bold text-slate-900">All Tasks</h3>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search tasks..." 
                className="pl-9 pr-4 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0066FF]/20 w-64"
              />
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-100">
                  <th className="p-4 font-semibold">Task</th>
                  <th className="p-4 font-semibold">Assignee</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold">Priority</th>
                  <th className="p-4 font-semibold">Due Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {tasks && tasks.length > 0 ? (
                  tasks.map((task) => {
                    const emp = task.employees as unknown as { employee_name: string, profile_photo: string | null }
                    return (
                      <tr key={task.id} className="hover:bg-slate-50 transition-colors group">
                        <td className="p-4">
                          <Link href={`/department/tasks/${task.id}`} className="block">
                            <p className="font-semibold text-slate-900 group-hover:text-[#0066FF] transition-colors">{task.task_title}</p>
                            <p className="text-slate-500 text-xs mt-0.5 line-clamp-1 max-w-md">{task.task_description}</p>
                          </Link>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            {emp?.profile_photo ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={emp.profile_photo} alt="" className="w-6 h-6 rounded-full object-cover" />
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-blue-100 text-[#0066FF] flex items-center justify-center text-[10px] font-bold">
                                {emp?.employee_name?.charAt(0) || '?'}
                              </div>
                            )}
                            <span className="font-medium text-slate-700">{emp?.employee_name}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <TaskStatusBadge status={task.task_status} />
                        </td>
                        <td className="p-4">
                          <PriorityBadge priority={task.priority_level} />
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-1.5 text-slate-600">
                            <Calendar className="w-4 h-4 text-slate-400" />
                            <span>{task.due_date}</span>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-500">
                      <ListTodo className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                      <p>No tasks found. Create one to get started.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  )
}
