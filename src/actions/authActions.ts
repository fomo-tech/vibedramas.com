'use server';

import bcrypt from 'bcryptjs';
import User from '@/models/User';
import connectDB from '@/lib/db';
import { createSession, deleteSession } from '@/lib/auth';
import { redirect } from 'next/navigation';

export async function loginAdmin(prevState: any, formData: FormData) {
  try {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    if (!email || !password) {
      return { error: 'Please enter both email and password.' };
    }

    await connectDB();
    const user = await User.findOne({ email });

    if (!user || user.role !== 'admin') {
      return { error: 'Invalid credentials or you are not an Admin.' };
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return { error: 'Invalid credentials.' };
    }

    await createSession(user._id.toString(), 'admin');
    
  } catch (error) {
     return { error: 'Something went wrong.' };
  }

  // Redirect outside try-catch to avoid swallowing NEXT_REDIRECT error
  redirect('/admin');
}

export async function logoutAdmin() {
  await deleteSession();
  redirect('/admin/login');
}
