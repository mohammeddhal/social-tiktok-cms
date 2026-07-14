'use client'

import { useState, useEffect } from 'react'
import { getUsers, createUser, updateUserStatus } from './actions'
import { Users, Plus, Shield, ShieldOff } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { ar } from 'date-fns/locale'

export default function UsersManagement() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'PHOTOGRAPHER' })
  const [submitting, setSubmitting] = useState(false)

  const loadUsers = async () => {
    setLoading(true)
    try {
      const data = await getUsers()
      setUsers(data)
    } catch (e) {
      toast.error('فشل في جلب المستخدمين')
    }
    setLoading(false)
  }

  useEffect(() => {
    loadUsers()
  }, [])

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await createUser(formData)
      toast.success('تم إنشاء المستخدم بنجاح')
      setShowAddModal(false)
      setFormData({ name: '', email: '', password: '', role: 'PHOTOGRAPHER' })
      loadUsers()
    } catch (e: any) {
      toast.error(e.message || 'حدث خطأ')
    }
    setSubmitting(false)
  }

  const handleStatusChange = async (userId: string, newStatus: 'ACTIVE' | 'INACTIVE') => {
    try {
      await updateUserStatus(userId, newStatus)
      toast.success('تم تحديث الحالة')
      loadUsers()
    } catch (e: any) {
      toast.error(e.message || 'حدث خطأ')
    }
  }

  if (loading) {
    return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
            <Users className="w-6 h-6 mr-2 text-blue-600" />
            إدارة المستخدمين
          </h1>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          إضافة مستخدم
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900/50">
              <tr>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">الاسم</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">البريد الإلكتروني</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">الدور</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">الحالة</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">تاريخ الانضمام</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">إجراءات</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {user.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {user.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {user.role === 'MANAGER' ? 'مدير' : user.role === 'PUBLISHER' ? 'مسؤول نشر' : 'مصور'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.status === 'ACTIVE' ? (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300">نشط</span>
                    ) : (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300">موقوف</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {format(new Date(user.createdAt), 'dd MMM yyyy', { locale: ar })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {user.status === 'ACTIVE' ? (
                      <button onClick={() => handleStatusChange(user.id, 'INACTIVE')} className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 flex items-center" title="إيقاف الحساب">
                        <ShieldOff className="w-4 h-4 mr-1" />
                        إيقاف
                      </button>
                    ) : (
                      <button onClick={() => handleStatusChange(user.id, 'ACTIVE')} className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 flex items-center" title="تفعيل الحساب">
                        <Shield className="w-4 h-4 mr-1" />
                        تفعيل
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-gray-500 opacity-75 dark:bg-gray-900 dark:opacity-90" onClick={() => setShowAddModal(false)}></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
            <div className="relative z-10 inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-right overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full">
              <form onSubmit={handleCreateUser}>
                <div className="px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">إضافة مستخدم جديد</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">الاسم</label>
                      <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:text-white" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">البريد الإلكتروني</label>
                      <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:text-white" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">كلمة المرور</label>
                      <input required type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:text-white" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">الدور</label>
                      <select required value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:text-white">
                        <option value="PHOTOGRAPHER">مصور</option>
                        <option value="PUBLISHER">مسؤول نشر السوشال ميديا</option>
                        <option value="MANAGER">مدير</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 flex justify-end gap-3">
                  <button type="button" onClick={() => setShowAddModal(false)} className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:w-auto sm:text-sm">إلغاء</button>
                  <button type="submit" disabled={submitting} className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none sm:w-auto sm:text-sm disabled:opacity-50">
                    {submitting ? 'جاري الإضافة...' : 'إضافة'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
