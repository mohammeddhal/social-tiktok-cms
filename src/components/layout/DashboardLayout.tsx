'use client'

import { useState } from 'react'
import Link from 'next/link'
import { LogOut, Menu, X, Home, Upload, BarChart, Settings, Users, FileVideo, Archive } from 'lucide-react'
import { signOut } from 'next-auth/react'

type NavItem = {
  name: string
  href: string
  icon: any
}

const TikTokIcon = ({ className }: { className?: string }) => (
  <img src="/images/tiktok-logo.png" alt="TikTok" className={className} style={{ width: '24px', height: '24px', objectFit: 'contain' }} />
)

const SnapIcon = ({ className }: { className?: string }) => (
  <img src="/images/snapchat-logo.png" alt="Snapchat" className={className} style={{ width: '24px', height: '24px', objectFit: 'contain' }} />
)

export function DashboardLayout({ children, role, user }: { children: React.ReactNode, role: string, user: any }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const getNavItems = () => {
    switch (role) {
      case 'PHOTOGRAPHER':
        return [
          { name: 'لوحة المهام', href: '/photographer', icon: Home },
        ]
      case 'PUBLISHER':
        return [
          { name: 'الرئيسية', href: '/publisher', icon: Home },
          { name: 'المهام', href: '/publisher/tiktok', icon: TikTokIcon },
          { name: 'المهام', href: '/publisher/snapchat', icon: SnapIcon },
          { name: 'الأرشيف', href: '/publisher/archive-tiktok', icon: TikTokIcon },
          { name: 'الأرشيف', href: '/publisher/archive-snapchat', icon: SnapIcon },
        ]
      case 'MANAGER':
        return [
          { name: 'المتابعة الرئيسية', href: '/manager', icon: Home },
          { name: 'إدارة المهام', href: '/manager/snapchat', icon: SnapIcon },
          { name: 'التقارير', href: '/manager/reports', icon: BarChart },
          { name: 'المستخدمون', href: '/manager/users', icon: Users },
          { name: 'الأرشيف', href: '/manager/archive-tiktok', icon: TikTokIcon },
          { name: 'الأرشيف', href: '/manager/archive-snapchat', icon: SnapIcon },
          { name: 'إعدادات النظام', href: '/manager/settings', icon: Settings },
        ]
      default:
        return []
    }
  }

  const navItems = getNavItems()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-40 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)}></div>
        <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white dark:bg-gray-800">
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button onClick={() => setSidebarOpen(false)} className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white">
              <span className="sr-only">Close sidebar</span>
              <X className="h-6 w-6 text-white" />
            </button>
          </div>
          <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
            <div className="flex-shrink-0 flex items-center px-4">
              <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">GRT CMS</span>
            </div>
            <nav className="mt-5 px-2 space-y-1">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href} className="group flex items-center px-2 py-2 text-base font-medium rounded-md text-gray-900 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                  <item.icon className="mr-4 flex-shrink-0 h-6 w-6 text-gray-500" />
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <div className="flex flex-col w-64 border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
            <div className="flex items-center flex-shrink-0 px-4">
              <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">GRT CMS</span>
            </div>
            <nav className="mt-8 flex-1 px-2 space-y-1">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href} className="group flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-900 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                  <item.icon className="ml-3 flex-shrink-0 h-6 w-6 text-gray-500" />
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex-shrink-0 flex border-t border-gray-200 dark:border-gray-700 p-4">
            <div className="flex-shrink-0 w-full group block">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{user.name}</p>
                  <p className="text-xs font-medium text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-300">
                    عرض الحساب
                  </p>
                </div>
                <button onClick={() => signOut()} className="text-red-600 hover:text-red-700" title="تسجيل الخروج">
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        <div className="lg:hidden relative z-10 flex-shrink-0 flex h-16 bg-white dark:bg-gray-800 shadow">
          <button
            type="button"
            className="px-4 border-r border-gray-200 dark:border-gray-700 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="sr-only">Open sidebar</span>
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex-1 px-4 flex justify-between">
            <div className="flex-1 flex items-center">
              <span className="text-xl font-bold text-gray-900 dark:text-white"></span>
            </div>
            <div className="ml-4 flex items-center md:ml-6">
              <button onClick={() => signOut()} className="p-1 rounded-full text-red-600 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                <span className="sr-only">تسجيل الخروج</span>
                <LogOut className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>

        <main className="flex-1 relative z-0 overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
