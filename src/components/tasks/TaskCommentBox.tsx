"use client"

import { useState } from "react"
import { Send, Loader2 } from "lucide-react"
import { addComment } from "@/app/actions/tasks"
import { Button } from "@/components/ui/button"

interface TaskCommentBoxProps {
  taskId: string
}

export function TaskCommentBox({ taskId }: TaskCommentBoxProps) {
  const [comment, setComment] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!comment.trim()) return

    setIsSubmitting(true)
    const result = await addComment(taskId, comment)
    
    if (result.success) {
      setComment("")
    } else {
      alert("Failed to add comment: " + result.error)
    }
    
    setIsSubmitting(false)
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 flex gap-3">
      <input
        type="text"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Write a comment..."
        className="flex-1 px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none focus:ring-2 focus:ring-[#0066FF]/20 transition-all text-sm"
        disabled={isSubmitting}
      />
      <Button 
        type="submit" 
        disabled={isSubmitting || !comment.trim()} 
        className="bg-[#0066FF] hover:bg-[#0052CC] text-white px-6 py-6 rounded-xl shadow-sm transition-all"
      >
        {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
      </Button>
    </form>
  )
}
