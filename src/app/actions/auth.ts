'use server';

import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { hashPassword, validatePasswordStrength } from '@/lib/auth/password';
import { registerSchema, type RegisterInput } from '@/lib/validations/auth';
import { extractEmailPrefix } from '@/lib/slug';

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

  // Extract email prefix for slug generation
  const emailPrefix = extractEmailPrefix(email);

  // Check if user already exists (by email or emailPrefix)
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [
        { email },
        { emailPrefix },
      ],
    },
  });

  if (existingUser) {
    if (existingUser.email === email) {
      return {
        error: 'User with this email already exists',
      };
    }
    return {
      error: 'Username is already taken. Please use a different email address.',
    };
  }

  // Hash password and create user
  const passwordHash = await hashPassword(password);

  try {
    const user = await prisma.user.create({
      data: {
        name,
        email,
        emailPrefix,
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
