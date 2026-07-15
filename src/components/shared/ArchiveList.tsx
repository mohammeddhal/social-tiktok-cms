'use client'

import { useState, useEffect } from 'react'
import { getPublisherTasks } from '@/app/publisher/actions'
import { deleteVideoPermanently } from '@/app/manager/actions'
import { Archive, AlertTriangle, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import { ar } from 'date-fns/locale'
import toast from 'react-hot-toast'

export function ArchiveList({ platform, hideDownload = false, allowDelete = false }: { platform: 'TIKTOK' | 'SNAPCHAT', hideDownload?: boolean, allowDelete?: boolean }) {
  const [tasks, setTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const loadTasks = async () => {
    setLoading(true)
    try {
      const data = await getPublisherTasks(platform, 'ARCHIVED')
      setTasks(data)
    } catch (e) {
      toast.error('فشل في جلب البيانات')
    }
    setLoading(false)
  }

  useEffect(() => {
    loadTasks()
  }, [platform])

  const handleDelete = async (videoId: string) => {
    if (!confirm('هل أنت متأكد من الحذف النهائي؟ سيتم حذف الفيديو من قاعدة البيانات ومن مساحة التخزين السحابية نهائياً ولا يمكن التراجع عن ذلك.')) return;
    
    try {
      await deleteVideoPermanently(videoId)
      toast.success('تم الحذف النهائي بنجاح')
      loadTasks()
    } catch (e: any) {
      toast.error(e.message || 'حدث خطأ أثناء الحذف')
    }
  }

  if (loading) {
    return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600"></div></div>
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
          <Archive className="w-6 h-6 mr-2 text-gray-600 dark:text-gray-300" />
          أرشيف {platform === 'TIKTOK' ? <img src="/images/tiktok-logo.png" alt="TikTok" className="inline-block h-6 mx-2" /> : <img src="/images/snapchat-logo.png" alt="Snapchat" className="inline-block h-6 mx-2" />}
        </h1>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900/50">
              <tr>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">الفيديو</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">المصور</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">التاريخ</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">الحالة</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">تأكيد بواسطة</th>
                {!hideDownload && (
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">الملف</th>
                )}
                {allowDelete && (
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">إجراءات</th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {tasks.map((task) => (
                <tr key={task.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900 dark:text-white flex items-center flex-wrap gap-2 break-all max-w-[200px] sm:max-w-xs">
                      {task.video.originalFilename}
                      {task.video.task.isPromotionDay && (
                        <span className="ml-2 bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300 text-xs px-2 py-0.5 rounded-full">ترويج</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {task.video.photographer.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {format(new Date(task.createdAt), 'EEEE, dd MMM yyyy', { locale: ar })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {task.status === 'PUBLISHED' ? (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300">
                        تم النشر
                      </span>
                    ) : (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300">
                        {platform === 'TIKTOK' ? 'مخالفة: تأخير' : 'لم ينشر'}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {task.publisher?.name || (platform === 'SNAPCHAT' && task.status === 'PUBLISHED' ? 'المدير' : '-')}
                  </td>
                  {!hideDownload && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {task.video.storageStatus === 'ACTIVE' ? (
                        <a href={task.video.fileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300">
                          تنزيل
                        </a>
                      ) : (
                        <span className="text-red-500 flex items-center text-xs">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          محذوف من التخزين
                        </span>
                      )}
                    </td>
                  )}
                  {allowDelete && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button onClick={() => handleDelete(task.video.id)} className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 flex items-center">
                        <Trash2 className="w-4 h-4 ml-1" /> حذف نهائي
                      </button>
                    </td>
                  )}
                </tr>
              ))}
              {tasks.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-gray-500 dark:text-gray-400">
                    لا توجد بيانات في الأرشيف
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
