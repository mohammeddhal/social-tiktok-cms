import nodemailer from 'nodemailer'

export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.hostinger.com',
  port: parseInt(process.env.SMTP_PORT || '465'),
  secure: true, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

export const sendPasswordResetEmail = async (email: string, resetToken: string) => {
  const resetLink = `${process.env.NEXTAUTH_URL}/reset-password?token=${resetToken}`

  const mailOptions = {
    from: `"نظام السوشال ميديا" <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'استعادة كلمة المرور',
    html: `
      <div dir="rtl" style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-bottom: 1px solid #e0e0e0;">
          <h2 style="margin: 0; color: #1a73e8;">استعادة كلمة المرور</h2>
        </div>
        <div style="padding: 20px;">
          <p>مرحباً،</p>
          <p>لقد تلقينا طلباً لإعادة تعيين كلمة المرور الخاصة بحسابك.</p>
          <p>يرجى الضغط على الزر أدناه لتعيين كلمة مرور جديدة (هذا الرابط صالح لمدة ساعة واحدة فقط):</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" style="background-color: #1a73e8; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">إعادة تعيين كلمة المرور</a>
          </div>
          <p style="font-size: 14px; color: #666;">إذا لم تقم بطلب هذا الإجراء، يمكنك تجاهل هذه الرسالة ولن يتم تغيير كلمة مرورك.</p>
        </div>
        <div style="background-color: #f8f9fa; padding: 15px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #e0e0e0;">
          <p style="margin: 0;">نظام إدارة المهام للسوشال ميديا</p>
        </div>
      </div>
    `
  }

  return transporter.sendMail(mailOptions)
}
