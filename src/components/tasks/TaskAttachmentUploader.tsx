"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { UploadCloud, Loader2, File, FileText, Image as ImageIcon } from "lucide-react"
import { addTaskAttachment } from "@/app/actions/tasks"
import { Button } from "@/components/ui/button"

export function TaskAttachmentUploader({ taskId }: { taskId: string }) {
  const [isUploading, setIsUploading] = useState(false)
  const supabase = createClient()

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setIsUploading(true)
      
      // 1. Upload to Supabase Storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${taskId}-${Math.random()}.${fileExt}`
      const filePath = `${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('task-attachments')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      // 2. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('task-attachments')
        .getPublicUrl(filePath)

      // 3. Save to database via server action
      const result = await addTaskAttachment(taskId, publicUrl, file.type)
      
      if (!result.success) throw new Error(result.error)
        
      alert("File uploaded successfully!")

    } catch (error: any) {
      alert("Error uploading file: " + error.message)
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="mt-4">
      <label className="relative cursor-pointer group flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 hover:bg-blue-50/50 hover:border-[#0066FF]/30 transition-colors">
        <input 
          type="file" 
          className="hidden" 
          onChange={handleFileChange}
          disabled={isUploading}
          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
        />
        {isUploading ? (
          <Loader2 className="w-8 h-8 animate-spin text-[#0066FF] mb-2" />
        ) : (
          <UploadCloud className="w-8 h-8 text-slate-400 group-hover:text-[#0066FF] transition-colors mb-2" />
        )}
        <p className="text-sm font-semibold text-slate-700">
          {isUploading ? "Uploading file..." : "Click to upload attachment"}
        </p>
        <p className="text-xs text-slate-500 mt-1">PDF, DOCX, XLSX, or Images (Max 5MB)</p>
      </label>
    </div>
  )
}
