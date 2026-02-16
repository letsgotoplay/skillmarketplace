import bcrypt from 'bcryptjs'
import { UserRole } from '@prisma/client'

export const USERS_PASSWORD = 'password123'

export async function getUsers() {
  const passwordHash = await bcrypt.hash(USERS_PASSWORD, 10)

  return [
    {
      id: 'user-admin-001',
      email: 'admin@example.com',
      emailPrefix: 'admin',
      passwordHash,
      name: 'Admin User',
      role: UserRole.ADMIN,
    },
    {
      id: 'user-alice-001',
      email: 'alice@example.com',
      emailPrefix: 'alice',
      passwordHash,
      name: 'Alice Johnson',
      role: UserRole.USER,
    },
    {
      id: 'user-bob-001',
      email: 'bob@example.com',
      emailPrefix: 'bob',
      passwordHash,
      name: 'Bob Smith',
      role: UserRole.USER,
    },
    {
      id: 'user-charlie-001',
      email: 'charlie@example.com',
      emailPrefix: 'charlie',
      passwordHash,
      name: 'Charlie Brown',
      role: UserRole.USER,
    },
    {
      id: 'user-diana-001',
      email: 'diana@example.com',
      emailPrefix: 'diana',
      passwordHash,
      name: 'Diana Prince',
      role: UserRole.USER,
    },
    {
      id: 'user-eve-001',
      email: 'eve@example.com',
      emailPrefix: 'eve',
      passwordHash,
      name: 'Eve Williams',
      role: UserRole.USER,
    },
  ]
}

export const USER_IDS = {
  admin: 'user-admin-001',
  alice: 'user-alice-001',
  bob: 'user-bob-001',
  charlie: 'user-charlie-001',
  diana: 'user-diana-001',
  eve: 'user-eve-001',
}
