import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json()
    if (!token || !password) {
      return NextResponse.json({ error: 'البيانات غير مكتملة' }, { status: 400 })
    }

    // Verify token
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token }
    })

    if (!resetToken) {
      return NextResponse.json({ error: 'الرابط غير صحيح أو منتهي الصلاحية' }, { status: 400 })
    }

    if (resetToken.expiresAt < new Date()) {
      // Delete expired token
      await prisma.passwordResetToken.delete({ where: { id: resetToken.id } })
      return NextResponse.json({ error: 'الرابط منتهي الصلاحية، يرجى طلب رابط جديد' }, { status: 400 })
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: resetToken.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 })
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(password, 10)

    // Update user password and delete token
    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { passwordHash }
      }),
      prisma.passwordResetToken.delete({
        where: { id: resetToken.id }
      })
    ])

    return NextResponse.json({ success: true, message: 'تم إعادة تعيين كلمة المرور بنجاح' })

  } catch (error: any) {
    console.error('Reset password error:', error)
    return NextResponse.json({ error: 'حدث خطأ أثناء معالجة الطلب.' }, { status: 500 })
  }
}
