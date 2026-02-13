'use server';

import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { hashPassword, validatePasswordStrength } from '@/lib/auth/password';
import { registerSchema, type RegisterInput } from '@/lib/validations/auth';

export async function register(data: RegisterInput) {
  // Validate input
  const validatedFields = registerSchema.safeParse(data);

  if (!validatedFields.success) {
    return {
      error: 'Invalid fields',
      fields: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { name, email, password } = validatedFields.data;

  // Validate password strength
  const passwordValidation = validatePasswordStrength(password);
  if (!passwordValidation.valid) {
    return {
      error: passwordValidation.errors.join(', '),
    };
  }

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    return {
      error: 'User with this email already exists',
    };
  }

  // Hash password and create user
  const passwordHash = await hashPassword(password);

  try {
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: 'USER',
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'REGISTER',
        resource: 'user',
        resourceId: user.id,
      },
    });

    return { success: true, userId: user.id };
  } catch (error) {
    console.error('Registration error:', error);
    return {
      error: 'An error occurred during registration',
    };
  }
}

export async function redirectToDashboard() {
  redirect('/dashboard');
}
