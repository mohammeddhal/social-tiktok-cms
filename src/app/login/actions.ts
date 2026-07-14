'use server'

import { signIn } from '@/lib/auth'
import { AuthError } from 'next-auth'

export async function authenticate(
  prevState: string | undefined,
  formData: FormData,
) {
  try {
    await signIn('credentials', {
      email: formData.get('email'),
      password: formData.get('password'),
      redirectTo: '/'
    })
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return 'بيانات الدخول غير صحيحة.'
        default:
          return 'حدث خطأ ما.'
      }
    }
    throw error
  }
}
