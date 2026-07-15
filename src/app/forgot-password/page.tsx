'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { ArrowRight, Mail } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return toast.error('الرجاء إدخال البريد الإلكتروني')

    setLoading(true)
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'حدث خطأ غير متوقع')
      }

      setSuccess(true)
      toast.success(data.message)
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8" dir="rtl">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            نسيت كلمة المرور؟
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            أدخل بريدك الإلكتروني المسجل لدينا وسنقوم بإرسال رابط لإعادة تعيين كلمة المرور.
          </p>
        </div>

        {success ? (
          <div className="bg-green-50 text-green-800 p-4 rounded-lg border border-green-200">
            <h3 className="font-bold mb-2">تم الإرسال بنجاح!</h3>
            <p className="text-sm">
              يرجى التحقق من صندوق الوارد في بريدك الإلكتروني (ومجلد الرسائل المزعجة Spam). 
              اضغط على الرابط الموجود في الرسالة لتعيين كلمة مرور جديدة.
            </p>
            <div className="mt-6 text-center">
              <Link href="/login" className="text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center justify-center">
                <ArrowRight className="w-4 h-4 mr-1" />
                العودة لتسجيل الدخول
              </Link>
            </div>
          </div>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="rounded-md shadow-sm -space-y-px">
              <div className="relative">
                <label htmlFor="email-address" className="sr-only">
                  البريد الإلكتروني
                </label>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="appearance-none rounded-lg relative block w-full px-3 py-3 pr-10 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="البريد الإلكتروني"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'جاري الإرسال...' : 'إرسال رابط الاستعادة'}
              </button>
            </div>
            
            <div className="text-center">
              <Link href="/login" className="text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors">
                تذكرت كلمة المرور؟ تسجيل الدخول
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
