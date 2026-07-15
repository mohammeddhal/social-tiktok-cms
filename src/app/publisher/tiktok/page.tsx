'use client'

import { useState, useEffect } from 'react'
import { getPublisherTasks, publishTask, getPublisherViolationsCount, checkPendingSnapchatForToday, publishSnapchatByVideo } from '../actions'
import { CheckCircle, Download, ExternalLink, Video, AlertTriangle, X } from 'lucide-react'
import { format } from 'date-fns'
import { ar } from 'date-fns/locale'
import toast from 'react-hot-toast'

export default function PublisherTikTokDashboard() {
  const [tasks, setTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [role, setRole] = useState('PUBLISHER')
  const [violations, setViolations] = useState(0)
  const [hasSnapchat, setHasSnapchat] = useState(false)
  const [showViolationsModal, setShowViolationsModal] = useState(false)
  const [violationsList, setViolationsList] = useState<any[]>([])

  const loadViolationsList = async () => {
    try {
      const { getPublisherViolations } = await import('../actions')
      const data = await getPublisherViolations('TIKTOK')
      setViolationsList(data)
    } catch(e) {
      toast.error('فشل جلب قائمة المخالفات')
    }
  }

  const loadTasks = async () => {
    setLoading(true)
    try {
      const { tasks: data, role: userRole } = await getPublisherTasks('TIKTOK', 'PENDING')
      setTasks(data)
      setRole(userRole)
      if (userRole === 'PUBLISHER') {
        const vCount = await getPublisherViolationsCount()
        setViolations(vCount)
        const hasSnap = await checkPendingSnapchatForToday()
        setHasSnapchat(hasSnap)
      }
    } catch (e) {
      toast.error('فشل في جلب البيانات')
    }
    setLoading(false)
  }

  useEffect(() => {
    loadTasks()
  }, [])

  const handlePublish = async (taskId: string) => {
    const link = prompt('الرجاء إدخال رابط الفيديو بعد نشره في التيك توك لتأكيد النشر:')
    if (link === null) return // User cancelled
    if (link.trim() === '') {
      toast.error('يجب إدخال الرابط لتأكيد النشر')
      return
    }

    try {
      await publishTask(taskId, link.trim())
      toast.success('تم تأكيد النشر بنجاح وحفظ الرابط!')
      loadTasks()
    } catch (e: any) {
      toast.error(e.message || 'حدث خطأ')
    }
  }

  if (loading) {
    return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
              <img src="/images/tiktok-logo.png" alt="TikTok" className="h-8 object-contain" />
            </h1>
            {role === 'PUBLISHER' && (
              <p className="text-gray-500 dark:text-gray-400 mt-1">يجب تأكيد النشر قبل الساعة 4:00 عصراً لتجنب المخالفات.</p>
            )}
          </div>
          {violations > 0 && (
            <button 
              onClick={() => {
                loadViolationsList()
                setShowViolationsModal(true)
              }}
              className="bg-red-100 hover:bg-red-200 text-red-800 dark:bg-red-900/50 dark:hover:bg-red-900/70 dark:text-red-300 px-4 py-2 rounded-lg font-bold text-sm flex items-center transition-colors border-none cursor-pointer"
            >
              إجمالي المخالفات (تأخير النشر): {violations}
            </button>
          )}
        </div>
      </div>

      {hasSnapchat && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 p-4 rounded-md animate-pulse">
          <p className="text-yellow-800 dark:text-yellow-400 font-bold flex items-center">
            <span className="text-xl mr-2">⚠️</span>
            تنبيه: يوجد مقطع <img src="/images/snapchat-logo.png" alt="Snapchat" className="h-6 mx-2 inline-block object-contain" /> بانتظار النشر لهذا اليوم أيضاً! الرجاء عدم نسيانه.
          </p>
        </div>
      )}

      {tasks.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">جميع المهام مكتملة!</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-2">لا توجد فيديوهات بانتظار النشر حالياً.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tasks.map(task => (
            <div key={task.id} className={`bg-white dark:bg-gray-800 rounded-xl border shadow-sm overflow-hidden ${task.video.task.isPromotionDay ? 'ring-2 ring-orange-500' : 'border-gray-200 dark:border-gray-700'}`}>
              
              <div className="p-5">
                <div className="flex justify-between items-start mb-3">
                  <div className="min-w-0 flex-1 ml-2">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white break-all" title={task.video.originalFilename}>
                      {task.video.originalFilename}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      المصور: {task.video.photographer.name}
                    </p>
                  </div>
                  {task.video.task.isPromotionDay && (
                    <span className="bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300 text-xs font-bold px-2 py-1 rounded-full whitespace-nowrap">
                      🔥 ترويج
                    </span>
                  )}
                </div>

                <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1 mb-4">
                  <p>تم الرفع: {format(new Date(task.video.uploadedAt), 'EEEE, dd MMM yyyy - hh:mm a', { locale: ar })}</p>
                </div>

                {task.video.notes && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg mb-4 text-sm text-blue-800 dark:text-blue-300">
                    <strong>ملاحظات: </strong>
                    {task.video.notes}
                  </div>
                )}

                {role === 'PUBLISHER' ? (
                  <>
                    <button onClick={() => {
                      const downloadUrl = `/api/download?url=${encodeURIComponent(task.video.fileUrl)}&filename=${encodeURIComponent(task.video.originalFilename)}`
                      window.open(downloadUrl, '_blank');
                      setTimeout(() => window.open('https://tiktok.com/upload', '_blank'), 100);
                    }} className="w-full bg-black hover:bg-gray-800 text-white dark:bg-black dark:hover:bg-gray-900 px-4 py-2 rounded-lg text-sm font-medium flex items-center justify-center transition-colors">
                      <Download className="w-4 h-4 ml-2" />
                      النشر عبر تيك توك
                    </button>

                    {task.video.task.isPromotionDay && (
                      <button onClick={() => {
                        const downloadUrl = `/api/download?url=${encodeURIComponent(task.video.fileUrl)}&filename=${encodeURIComponent(task.video.originalFilename)}`
                        window.open(downloadUrl, '_blank');
                        setTimeout(() => window.open('https://snapchat.com/spotlight', '_blank'), 100);
                      }} className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 px-4 py-2 rounded-lg text-sm font-medium flex items-center justify-center transition-colors mt-2">
                        <Download className="w-4 h-4 ml-2" />
                        النشر عبر سناب شات
                      </button>
                    )}

                    <button onClick={() => handlePublish(task.id)} className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center justify-center transition-colors mt-4">
                      <CheckCircle className="w-4 h-4 ml-2" />
                      تأكيد النشر (تيك توك)
                    </button>

                    {task.video.task.isPromotionDay && (
                      <button onClick={async () => {
                        try {
                          await publishSnapchatByVideo(task.video.id);
                          toast.success('تم تأكيد نشر سناب شات');
                          loadTasks();
                        } catch (e: any) {
                          toast.error(e.message || 'فشل تأكيد سناب شات');
                        }
                      }} className="w-full bg-green-100 hover:bg-green-200 text-green-800 px-4 py-2 rounded-lg text-sm font-medium flex items-center justify-center transition-colors mt-2">
                        <CheckCircle className="w-4 h-4 ml-2" />
                        تأكيد النشر (سناب شات)
                      </button>
                    )}
                  </>
                ) : (
                  <a href={task.video.fileUrl} target="_blank" rel="noopener noreferrer" className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300 px-4 py-2 rounded-lg text-sm font-medium flex items-center justify-center transition-colors">
                    <Video className="w-4 h-4 ml-2" />
                    معاينة الفيديو
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      {/* Violations Modal */}
      {showViolationsModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-900/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <AlertTriangle className="w-6 h-6 text-red-500" />
                الأيام المخالفة (تأخير النشر)
              </h2>
              <button onClick={() => setShowViolationsModal(false)} className="text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full p-2">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              {violationsList.length === 0 ? (
                <p className="text-center text-gray-500 py-4">جاري التحميل...</p>
              ) : (
                violationsList.map(v => (
                  <div key={v.id} className="p-4 border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800/30 rounded-xl flex flex-col sm:flex-row justify-between gap-4">
                    <div>
                      <p className="font-bold text-red-700 dark:text-red-300">يوم: {format(new Date(v.video.task.date), 'EEEE, dd MMMM', { locale: ar })}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">الفيديو: {v.video.originalFilename}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">المصور: {v.video.photographer.name}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
