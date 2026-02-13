import { PrismaClient } from '@prisma/client'
import {
  getUsers,
  TEAMS,
  TEAM_MEMBERS,
  SKILLS,
  SKILL_VERSIONS,
  SKILL_FILES,
  SKILL_STATS,
  EVAL_QUEUES,
  EVAL_RESULTS,
  SECURITY_SCANS,
  SKILL_BUNDLES,
  BUNDLE_SKILLS,
  getAuditLogsWithDates,
  USERS_PASSWORD,
} from './seed-data'

const prisma = new PrismaClient()

async function clearDatabase() {
  console.log('🗑️  Clearing existing data...')

  // Delete in reverse dependency order
  await prisma.auditLog.deleteMany()
  await prisma.evalResult.deleteMany()
  await prisma.evalQueue.deleteMany()
  await prisma.securityScan.deleteMany()
  await prisma.bundleSkill.deleteMany()
  await prisma.skillBundle.deleteMany()
  await prisma.skillStat.deleteMany()
  await prisma.skillFile.deleteMany()
  await prisma.skillVersion.deleteMany()
  await prisma.skill.deleteMany()
  await prisma.teamMember.deleteMany()
  await prisma.team.deleteMany()
  await prisma.user.deleteMany()

  console.log('✅ Database cleared')
}

async function seedUsers() {
  console.log('👥 Seeding users...')
  const users = await getUsers()

  for (const user of users) {
    await prisma.user.create({ data: user })
  }

  console.log(`   Created ${users.length} users`)
  return users
}

async function seedTeams() {
  console.log('🏢 Seeding teams...')

  for (const team of TEAMS) {
    await prisma.team.create({ data: team })
  }

  for (const member of TEAM_MEMBERS) {
    await prisma.teamMember.create({ data: member })
  }

  console.log(`   Created ${TEAMS.length} teams with ${TEAM_MEMBERS.length} members`)
}

async function seedSkills() {
  console.log('📦 Seeding skills...')

  for (const skill of SKILLS) {
    await prisma.skill.create({ data: skill })
  }

  for (const version of SKILL_VERSIONS) {
    await prisma.skillVersion.create({ data: version })
  }

  for (const file of SKILL_FILES) {
    await prisma.skillFile.create({ data: file })
  }

  for (const stat of SKILL_STATS) {
    await prisma.skillStat.create({ data: stat })
  }

  console.log(`   Created ${SKILLS.length} skills with ${SKILL_VERSIONS.length} versions, ${SKILL_FILES.length} files`)
}

async function seedEvaluationAndSecurity() {
  console.log('🔍 Seeding evaluations and security scans...')

  for (const evalQueue of EVAL_QUEUES) {
    await prisma.evalQueue.create({ data: evalQueue })
  }

  for (const result of EVAL_RESULTS) {
    await prisma.evalResult.create({ data: result })
  }

  for (const scan of SECURITY_SCANS) {
    await prisma.securityScan.create({ data: scan })
  }

  console.log(`   Created ${EVAL_QUEUES.length} eval jobs, ${SECURITY_SCANS.length} security scans`)
}

async function seedBundles() {
  console.log('📚 Seeding skill bundles...')

  for (const bundle of SKILL_BUNDLES) {
    await prisma.skillBundle.create({ data: bundle })
  }

  for (const bundleSkill of BUNDLE_SKILLS) {
    await prisma.bundleSkill.create({ data: bundleSkill })
  }

  console.log(`   Created ${SKILL_BUNDLES.length} bundles with ${BUNDLE_SKILLS.length} skill associations`)
}

async function seedAuditLogs() {
  console.log('📋 Seeding audit logs...')

  const auditLogs = getAuditLogsWithDates()

  for (const log of auditLogs) {
    await prisma.auditLog.create({ data: log })
  }

  console.log(`   Created ${auditLogs.length} audit log entries`)
}

async function printSummary() {
  console.log('\n' + '='.repeat(60))
  console.log('📊 SEED SUMMARY')
  console.log('='.repeat(60))

  const userCount = await prisma.user.count()
  const teamCount = await prisma.team.count()
  const teamMemberCount = await prisma.teamMember.count()
  const skillCount = await prisma.skill.count()
  const skillVersionCount = await prisma.skillVersion.count()
  const skillFileCount = await prisma.skillFile.count()
  const bundleCount = await prisma.skillBundle.count()
  const evalCount = await prisma.evalQueue.count()
  const scanCount = await prisma.securityScan.count()
  const auditCount = await prisma.auditLog.count()

  console.log(`
  Users:          ${userCount}
  Teams:          ${teamCount}
  Team Members:   ${teamMemberCount}
  Skills:         ${skillCount}
  Skill Versions: ${skillVersionCount}
  Skill Files:    ${skillFileCount}
  Bundles:        ${bundleCount}
  Eval Jobs:      ${evalCount}
  Security Scans: ${scanCount}
  Audit Logs:     ${auditCount}
`)
  console.log('='.repeat(60))
  console.log(`🔐 Test user password: ${USERS_PASSWORD}`)
  console.log('📧 Test accounts:')
  console.log('   - admin@example.com (ADMIN)')
  console.log('   - alice@example.com (Team Owner)')
  console.log('   - bob@example.com (Team Admin)')
  console.log('   - charlie@example.com (Team Member)')
  console.log('   - diana@example.com (Solo Creator)')
  console.log('   - eve@example.com (Regular User)')
  console.log('='.repeat(60) + '\n')
}

async function main() {
  console.log('\n🌱 Starting database seed...\n')

  try {
    await clearDatabase()
    await seedUsers()
    await seedTeams()
    await seedSkills()
    await seedEvaluationAndSecurity()
    await seedBundles()
    await seedAuditLogs()
    await printSummary()

    console.log('✅ Seed completed successfully!\n')
  } catch (error) {
    console.error('❌ Seed failed:', error)
    throw error
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
