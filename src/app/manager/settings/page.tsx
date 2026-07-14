'use client'

import { useState, useEffect } from 'react'
import { getSystemSettings, updateSystemSettings } from './actions'
import toast from 'react-hot-toast'
import { Save, Clock } from 'lucide-react'

export default function SystemSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [photographerHour, setPhotographerHour] = useState('11')
  const [publisherHour, setPublisherHour] = useState('15')

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const settings = await getSystemSettings()
      setPhotographerHour(settings.PHOTOGRAPHER_DEADLINE_HOUR)
      setPublisherHour(settings.PUBLISHER_DEADLINE_HOUR)
    } catch (e) {
      toast.error('فشل في جلب الإعدادات')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await updateSystemSettings(photographerHour, publisherHour)
      toast.success('تم حفظ الإعدادات بنجاح')
    } catch (e) {
      toast.error('فشل في حفظ الإعدادات')
    } finally {
      setSaving(false)
    }
  }

  // Generate hours array from 1 to 24 with nice labels
  const hours = Array.from({ length: 24 }, (_, i) => {
    const hour = i + 1
    const period = hour >= 12 ? 'مساءً' : 'صباحاً'
    const displayHour = hour > 12 ? hour - 12 : hour
    return {
      value: hour.toString(),
      label: `${displayHour}:00 ${period}`
    }
  })

  if (loading) {
    return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center mb-6">
          <Clock className="w-6 h-6 mr-2 ml-2 text-blue-600" />
          إعدادات أوقات الرفع والنشر
        </h1>

        <div className="space-y-6">
          {/* Photographer Setting */}
          <div className="bg-gray-50 dark:bg-gray-700/50 p-5 rounded-lg border border-gray-100 dark:border-gray-600">
            <label className="block text-lg font-bold text-gray-800 dark:text-gray-200 mb-2">
              وقت نهاية تحميل الفيديوهات (للمصور)
            </label>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              الوقت الذي يجب على المصورين الانتهاء من رفع فيديوهات اليوم قبله، وإلا سيتم احتساب اليوم كمتأخر.
            </p>
            <select
              value={photographerHour}
              onChange={(e) => setPhotographerHour(e.target.value)}
              className="block w-full max-w-sm px-4 py-3 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md dark:bg-gray-800 dark:border-gray-600 dark:text-white"
            >
              {hours.map((h) => (
                <option key={h.value} value={h.value}>{h.label}</option>
              ))}
            </select>
          </div>

          {/* Publisher Setting */}
          <div className="bg-gray-50 dark:bg-gray-700/50 p-5 rounded-lg border border-gray-100 dark:border-gray-600">
            <label className="block text-lg font-bold text-gray-800 dark:text-gray-200 mb-2">
              وقت نهاية النشر (لمسؤول السوشيال ميديا)
            </label>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              الوقت الذي يجب على مسؤول النشر الانتهاء من نشر الفيديوهات فيه، وإلا سيتم احتسابه كمتأخر في لوحة التحكم.
            </p>
            <select
              value={publisherHour}
              onChange={(e) => setPublisherHour(e.target.value)}
              className="block w-full max-w-sm px-4 py-3 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md dark:bg-gray-800 dark:border-gray-600 dark:text-white"
            >
              {hours.map((h) => (
                <option key={h.value} value={h.value}>{h.label}</option>
              ))}
            </select>
          </div>

          <div className="pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
            >
              {saving ? 'جاري الحفظ...' : (
                <>
                  <Save className="w-5 h-5 ml-2" />
                  حفظ الإعدادات
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
