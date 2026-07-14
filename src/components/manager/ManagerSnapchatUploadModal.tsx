'use client'

import { useState } from 'react'
import { generateSnapchatUploadUrl, saveSnapchatVideoRecord } from '@/app/manager/snapchat/uploadActions'
import toast from 'react-hot-toast'
import { X, UploadCloud, FileVideo } from 'lucide-react'

export function ManagerSnapchatUploadModal({ dateStr, onClose, onSuccess }: { dateStr: string, onClose: () => void, onSuccess: () => void }) {
  const [file, setFile] = useState<File | null>(null)
  const [notes, setNotes] = useState('')
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleUpload = async () => {
    if (!file) return

    setUploading(true)
    setProgress(10)

    try {
      const { uploadUrl, fileKey, taskId } = await generateSnapchatUploadUrl(dateStr, file.name, file.type)
      setProgress(30)

      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        }
      })

      if (!uploadRes.ok) throw new Error('فشل الرفع إلى التخزين السحابي')
      setProgress(90)

      await saveSnapchatVideoRecord(taskId, fileKey, file.name, file.size, notes || null)
      setProgress(100)

      toast.success('تم رفع فيديو سناب شات بنجاح!')
      onSuccess()
    } catch (e: any) {
      toast.error(e.message || 'حدث خطأ غير متوقع أثناء الرفع')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 opacity-75 dark:bg-gray-900 dark:opacity-90" onClick={!uploading ? onClose : undefined}></div>
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
        
        <div className="relative z-10 inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-right overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full">
          <div className="px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                رفع فيديو <img src="/images/snapchat-logo.png" alt="Snapchat" className="h-6 mx-2 object-contain" /> للناشر
              </h3>
              <button onClick={onClose} disabled={uploading} className="text-gray-400 hover:text-gray-500 focus:outline-none">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="mt-2">
              <p className="text-sm text-gray-500 mb-4 dark:text-gray-400">
                سيتم رفع هذا الفيديو وإرساله مباشرة لمسؤول السوشيال ميديا لنشره على سناب شات في نفس اليوم المختار.
              </p>

              {!file ? (
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <div className="space-y-1 text-center">
                    <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600 dark:text-gray-300 justify-center">
                      <label htmlFor="file-upload" className="relative cursor-pointer bg-white dark:bg-gray-800 rounded-md font-medium text-yellow-600 hover:text-yellow-500 focus-within:outline-none px-2 py-1">
                        <span>اختر ملف فيديو</span>
                        <input id="file-upload" name="file-upload" type="file" accept="video/*" className="sr-only" onChange={handleFileChange} />
                      </label>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 p-4 rounded-lg flex items-center justify-between mb-4">
                  <div className="flex items-center overflow-hidden">
                    <FileVideo className="h-8 w-8 text-yellow-500 mr-3 flex-shrink-0" />
                    <div className="truncate text-right w-full">
                      <p className="text-sm font-medium text-yellow-900 dark:text-yellow-200 truncate">{file.name}</p>
                      <p className="text-xs text-yellow-700 dark:text-yellow-400">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                    </div>
                  </div>
                  {!uploading && (
                    <button onClick={() => setFile(null)} className="text-red-500 hover:text-red-700 p-1">
                      <X className="h-5 w-5" />
                    </button>
                  )}
                </div>
              )}

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 text-right mb-1">
                  ملاحظات للناشر (اختياري)
                </label>
                <textarea
                  rows={3}
                  className="shadow-sm focus:ring-yellow-500 focus:border-yellow-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white p-2 border"
                  placeholder="مثال: يرجى التركيز على الصوت في الثواني الأولى..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  disabled={uploading}
                />
              </div>

              {uploading && (
                <div className="mt-4">
                  <div className="relative pt-1">
                    <div className="flex mb-2 items-center justify-between">
                      <div>
                        <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-yellow-600 bg-yellow-200">
                          جاري الرفع...
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-semibold inline-block text-yellow-600 dark:text-yellow-400">
                          {progress}%
                        </span>
                      </div>
                    </div>
                    <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-yellow-200 dark:bg-gray-700">
                      <div style={{ width: `${progress}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-yellow-400 transition-all duration-300"></div>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 flex justify-end gap-3">
            <button
              type="button"
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none sm:mt-0 sm:w-auto sm:text-sm disabled:opacity-50"
              onClick={onClose}
              disabled={uploading}
            >
              إلغاء
            </button>
            <button
              type="button"
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-yellow-500 text-base font-medium text-black hover:bg-yellow-400 focus:outline-none sm:w-auto sm:text-sm disabled:opacity-50"
              onClick={handleUpload}
              disabled={!file || uploading}
            >
              {uploading ? 'جاري الرفع...' : 'تأكيد الرفع السناب شات'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
