'use client'

import { useState, useEffect } from 'react'
import { getPhotographerData, getDelayedDays } from './actions'
import { AlertCircle, Calendar as CalendarIcon, Upload, Trash2, RefreshCw, Eye, CheckCircle } from 'lucide-react'
import { format } from 'date-fns'
import { ar } from 'date-fns/locale'
import toast from 'react-hot-toast'
import { UploadModal } from '@/components/photographer/UploadModal'
import { deleteVideo } from './uploadActions'

export default function PhotographerDashboard() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showDelayedModal, setShowDelayedModal] = useState(false)
  const [delayedDays, setDelayedDays] = useState<any[]>([])
  
  const [uploadDate, setUploadDate] = useState<string | null>(null)

  const loadData = async () => {
    setLoading(true)
    try {
      const result = await getPhotographerData()
      setData(result)
    } catch (e) {
      toast.error('حدث خطأ أثناء جلب البيانات')
    }
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleShowDelayed = async () => {
    try {
      if (!data || !data.days) return;
      const delayed = data.days.filter((d: any) => d.status === 'DELAYED');
      // Set to delayed array. If it's empty, we should still show the modal but say "No delayed days" instead of loading forever
      setDelayedDays(delayed);
      setShowDelayedModal(true);
    } catch (e) {
      toast.error('حدث خطأ')
    }
  }

  if (loading && !data) {
    return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>
  }

  const delayedCount = data?.delayedTasksCount || 0

  return (
    <div className="space-y-6">
      {/* Status Indicator */}
      <div className="flex justify-start mb-6">
        {delayedCount > 0 ? (
          <button 
            onClick={handleShowDelayed}
            className="flex items-center gap-2 bg-white dark:bg-gray-800 px-4 py-2 rounded-full shadow-sm border border-red-200 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors cursor-pointer"
          >
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
            <span className="text-sm font-bold text-red-600 dark:text-red-400">
              يوجد {delayedCount} أيام متأخرة (اضغط للتفاصيل)
            </span>
          </button>
        ) : (
          <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-4 py-2 rounded-full shadow-sm border border-gray-100 dark:border-gray-700">
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
              سجل الرفع مكتمل
            </span>
          </div>
        )}
      </div>


      {/* Calendar Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-4">
        {data?.days.map((day: any) => (
          <DayCard key={day.date} day={day} reload={loadData} onUpload={() => setUploadDate(day.date)} />
        ))}
      </div>

      {uploadDate && (
        <UploadModal 
          dateStr={uploadDate} 
          onClose={() => setUploadDate(null)} 
          onSuccess={() => { 
            setUploadDate(null); 
            loadData(); 
            toast.success('تم اضافة الفديو لهذا اليوم'); 
          }} 
        />
      )}

      {/* Delayed Modal */}
      {showDelayedModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true" onClick={() => setShowDelayedModal(false)}>
              <div className="absolute inset-0 bg-gray-500 opacity-75 dark:bg-gray-900 dark:opacity-90"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="relative z-10 inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-right overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full">
              <div className="px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">الأيام المتأخرة</h3>
                <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                  {delayedDays.length === 0 ? <p className="text-gray-500">جاري التحميل...</p> : null}
                  {delayedDays.map(d => (
                    <div key={d.id} className="bg-red-50 dark:bg-red-900/30 p-3 rounded-lg flex justify-between items-center">
                      <span className="text-red-700 dark:text-red-400 font-semibold">{format(new Date(d.date), 'EEEE, dd MMMM yyyy', { locale: ar })}</span>
                      <span className="bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-200 text-xs px-2 py-1 rounded-full">عجز</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-gray-300 text-base font-medium text-gray-700 hover:bg-gray-400 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setShowDelayedModal(false)}
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function DayCard({ day, reload, onUpload }: { day: any, reload: () => void, onUpload: () => void }) {
  const dateObj = new Date(day.date)
  
  let cardStyle = 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
  let statusBadge = null

  const isPublishedByManager = day.task?.videos?.some((v: any) => v.socialTasks?.some((st: any) => st.status === 'PUBLISHED'));

  if (day.status === 'DELAYED') {
    cardStyle = 'bg-red-50/70 dark:bg-red-900/20 border-red-300 dark:border-red-800 opacity-60'
    statusBadge = <span className="bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300 text-[10px] font-bold px-1.5 py-0.5 rounded">متأخر</span>
  } else if (day.status === 'UPLOADED' && isPublishedByManager) {
    cardStyle = 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-400 dark:border-emerald-700'
    statusBadge = <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300 text-[10px] font-bold px-1.5 py-0.5 rounded">تم النشر</span>
  } else if (day.status === 'UPLOADED' && day.isPastDeadline) {
    cardStyle = 'bg-gray-100 dark:bg-gray-800/50 border-gray-300 dark:border-gray-700 opacity-60'
    statusBadge = <span className="bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300 text-[10px] font-bold px-1.5 py-0.5 rounded">لم يتم نشره</span>
  } else if (day.status === 'UPLOADED') {
    cardStyle = 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-800'
    statusBadge = <span className="bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 text-[10px] font-bold px-1.5 py-0.5 rounded">قيد المراجعة</span>
  } else if (day.status === 'PENDING') {
    cardStyle = 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 border-dashed'
    statusBadge = <span className="bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300 text-[10px] font-bold px-1.5 py-0.5 rounded">فارغ</span>
  }

  const handleDelete = async (videoId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الفيديو؟')) return
    try {
      await deleteVideo(videoId)
      toast.success('تم حذف الفيديو بنجاح')
      reload()
    } catch (e: any) {
      toast.error(e.message || 'فشل الحذف')
    }
  }

  return (
    <div className={`rounded-xl border shadow-sm p-3 relative transition-all flex flex-col justify-between ${cardStyle} ${day.isPromotionDay ? 'ring-2 ring-orange-500' : ''}`}>
      {day.isPromotionDay && (
        <div className="absolute -top-2 -right-2 bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md">
          🔥 ترويج
        </div>
      )}
      
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">{day.dayName}</h3>
          <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
            {format(dateObj, 'dd MMM', { locale: ar })}
          </p>
        </div>
        {statusBadge}
      </div>

      <div className="mt-3 flex flex-col gap-1.5 w-full">
        {((day.status === 'PENDING' || day.isPromotionDay) && !day.isPastDeadline) && (
          <button onClick={onUpload} className="w-full bg-blue-600 hover:bg-blue-700 text-white px-2 py-1.5 rounded-md text-xs font-medium flex items-center justify-center transition-colors">
            <Upload className="w-3 h-3 ml-1" /> رفع {day.isPromotionDay && day.task?.videos?.length > 0 ? 'إضافي' : ''}
          </button>
        )}
        
        {day.status === 'UPLOADED' && day.task?.videos?.map((v: any, index: number) => {
          const isPublished = v.socialTasks?.some((st: any) => st.status === 'PUBLISHED');
          return (
          <div key={v.id} className="w-full flex flex-col gap-1 bg-white dark:bg-gray-800/80 p-2 rounded-md border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
            <p className="text-[10px] text-gray-700 dark:text-gray-300 truncate w-full text-center font-medium block" title={v.originalFilename}>
              {v.originalFilename}
            </p>
            <div className="w-full flex items-center gap-1 mt-1">
              <a href={v.fileUrl} target="_blank" rel="noopener noreferrer" className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300 px-2 py-1.5 rounded-md text-[10px] font-medium flex items-center justify-center transition-colors">
                <Eye className="w-3 h-3 ml-1" /> {day.isPromotionDay ? `شاهد ${index + 1}` : 'شاهد'}
              </a>
              
              {!day.isPastDeadline && !day.isPromotionDay && !isPublished && (
                <button onClick={onUpload} className="flex-1 bg-blue-100 hover:bg-blue-200 text-blue-700 dark:bg-blue-900/40 dark:hover:bg-blue-900/60 dark:text-blue-300 px-2 py-1.5 rounded-md text-[10px] font-medium flex items-center justify-center transition-colors">
                  <RefreshCw className="w-3 h-3 ml-1" /> بدّل
                </button>
              )}

              {!day.isPastDeadline && !isPublished && (
                <button onClick={() => handleDelete(v.id)} className="flex-none bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-900/40 dark:hover:bg-red-900/60 dark:text-red-300 px-2 py-1.5 rounded-md flex items-center justify-center transition-colors">
                  <Trash2 className="w-3 h-3" />
                </button>
              )}

              {isPublished && (
                <>
                  <div className="flex-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 px-2 py-1.5 rounded-md text-[10px] font-medium flex items-center justify-center border border-emerald-200 dark:border-emerald-800">
                    <CheckCircle className="w-3 h-3 ml-1" /> منشور
                  </div>
                  <button onClick={onUpload} className="flex-1 bg-purple-100 hover:bg-purple-200 text-purple-700 dark:bg-purple-900/40 dark:hover:bg-purple-900/60 dark:text-purple-300 px-2 py-1.5 rounded-md text-[10px] font-medium flex items-center justify-center transition-colors">
                    <Upload className="w-3 h-3 ml-1" /> تجربة
                  </button>
                </>
              )}
            </div>
          </div>
        )})}
        
        {day.status === 'PENDING' && day.isPastDeadline && (
          <div className="w-full text-center py-1.5 bg-gray-100 dark:bg-gray-700/50 rounded-md text-gray-500 dark:text-gray-400 text-[10px]">
            انتهى الوقت
          </div>
        )}

        {day.status === 'DELAYED' && (
          <div className="w-full text-center py-1.5 bg-red-100 dark:bg-red-900/30 rounded-md text-red-600 dark:text-red-400 text-[10px] font-medium border border-red-200 dark:border-red-800">
            عجز
          </div>
        )}
      </div>
    </div>
  )
}
