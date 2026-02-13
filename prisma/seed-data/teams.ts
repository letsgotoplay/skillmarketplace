import { TeamRole } from '@prisma/client'
import { USER_IDS } from './users'

export const TEAMS = [
  {
    id: 'team-acme-001',
    name: 'Acme Corp',
    slug: 'acme-corp',
    description: 'Enterprise solutions for modern businesses',
  },
  {
    id: 'team-startup-001',
    name: 'Startup Labs',
    slug: 'startup-labs',
    description: 'Innovation hub for cutting-edge AI tools',
  },
]

export const TEAM_MEMBERS = [
  // Acme Corp members
  {
    id: 'tm-acme-alice',
    teamId: 'team-acme-001',
    userId: USER_IDS.alice,
    role: TeamRole.OWNER,
  },
  {
    id: 'tm-acme-bob',
    teamId: 'team-acme-001',
    userId: USER_IDS.bob,
    role: TeamRole.ADMIN,
  },
  {
    id: 'tm-acme-charlie',
    teamId: 'team-acme-001',
    userId: USER_IDS.charlie,
    role: TeamRole.MEMBER,
  },
  // Startup Labs members
  {
    id: 'tm-startup-diana',
    teamId: 'team-startup-001',
    userId: USER_IDS.diana,
    role: TeamRole.OWNER,
  },
  {
    id: 'tm-startup-eve',
    teamId: 'team-startup-001',
    userId: USER_IDS.eve,
    role: TeamRole.MEMBER,
  },
]

export const TEAM_IDS = {
  acme: 'team-acme-001',
  startup: 'team-startup-001',
}
