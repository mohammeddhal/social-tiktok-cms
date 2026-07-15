import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendPasswordResetEmail } from '@/lib/email'
import { v4 as uuidv4 } from 'uuid'
import { addHours } from 'date-fns'

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()
    if (!email) {
      return NextResponse.json({ error: 'البريد الإلكتروني مطلوب' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      // Return success even if user not found to prevent email enumeration
      return NextResponse.json({ success: true, message: 'إذا كان البريد الإلكتروني مسجلاً لدينا، ستصلك رسالة إعادة التعيين.' })
    }

    // Check if there is already a recent token
    const existingToken = await prisma.passwordResetToken.findFirst({
      where: { email },
      orderBy: { createdAt: 'desc' }
    })

    if (existingToken) {
      // If a token was generated in the last 2 minutes, prevent spam
      const timeDiff = new Date().getTime() - existingToken.createdAt.getTime()
      if (timeDiff < 2 * 60 * 1000) {
        return NextResponse.json({ error: 'الرجاء الانتظار قليلاً قبل طلب رابط جديد.' }, { status: 429 })
      }
    }

    // Generate a new token
    const token = uuidv4()
    const expiresAt = addHours(new Date(), 1) // 1 hour expiration

    await prisma.passwordResetToken.create({
      data: {
        email,
        token,
        expiresAt
      }
    })

    // Send email
    await sendPasswordResetEmail(email, token)

    return NextResponse.json({ success: true, message: 'تم إرسال رابط استعادة كلمة المرور إلى بريدك الإلكتروني.' })

  } catch (error: any) {
    console.error('Forgot password error:', error)
    return NextResponse.json({ error: 'حدث خطأ أثناء معالجة الطلب.' }, { status: 500 })
  }
}
