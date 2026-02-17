import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GitHubProvider from 'next-auth/providers/github';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/db';

// Helper to generate unique emailPrefix
async function generateUniqueEmailPrefix(email: string): Promise<string> {
  const basePrefix = email.split('@')[0].toLowerCase();
  let prefix = basePrefix;
  let counter = 1;

  while (await prisma.user.findUnique({ where: { emailPrefix: prefix } })) {
    prefix = `${basePrefix}${counter}`;
    counter++;
  }

  return prefix;
}

// Custom PrismaAdapter that handles emailPrefix generation for OAuth users
function customPrismaAdapter() {
  const adapter = PrismaAdapter(prisma);

  // Override createUser to set emailPrefix
  const originalCreateUser = adapter.createUser;
  adapter.createUser = async (user: any) => {
    if (!user.emailPrefix && user.email) {
      user.emailPrefix = await generateUniqueEmailPrefix(user.email);
    }
    return originalCreateUser!(user);
  };

  return adapter;
}

export const authOptions: NextAuthOptions = {
  adapter: customPrismaAdapter(),
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Invalid credentials');
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email,
          },
        });

        if (!user || !user.passwordHash) {
          throw new Error('Invalid credentials');
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );

        if (!isPasswordValid) {
          throw new Error('Invalid credentials');
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
    // GitHub OAuth - only enabled if credentials are configured
    ...(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET
      ? [
          GitHubProvider({
            clientId: process.env.GITHUB_CLIENT_ID,
            clientSecret: process.env.GITHUB_CLIENT_SECRET,
          }),
        ]
      : []),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
  events: {
    async signIn({ user }) {
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'LOGIN',
          resource: 'user',
          resourceId: user.id,
        },
      });
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
};

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      role: string;
    };
  }

  interface User {
    id: string;
    role: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: string;
  }
}
