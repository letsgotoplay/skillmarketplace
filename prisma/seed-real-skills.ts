import { PrismaClient, Visibility, SkillStatus, JobStatus, TestStatus, Category } from '@prisma/client'
import { scanSkill, SecurityReport } from '../src/lib/security/scanner'
import { getStorageProvider } from '../src/lib/storage/provider'
import JSZip from 'jszip'
import { randomUUID } from 'crypto'
import * as fs from 'fs'
import * as path from 'path'
import { getUsers, USERS_PASSWORD, USER_IDS } from './seed-data/users'
import { TEAMS, TEAM_MEMBERS, TEAM_IDS } from './seed-data/teams'
import { getAuditLogsWithDates } from './seed-data/audit-logs'
import { generateSkillSlug, generateFullSlug } from '../src/lib/slug'

const prisma = new PrismaClient()
const storage = getStorageProvider()

// Path to test-skills folder
const TEST_SKILLS_DIR = path.join(process.cwd(), 'test-skills')

// Skill configuration - maps zip filename to additional metadata
interface SkillConfig {
  category: Category
  visibility: Visibility
  teamId: string | null
  authorId: string
  tags: string[]
}

// Visibility distribution: 14 PUBLIC, 1 TEAM_ONLY, 1 PRIVATE
const SKILL_CONFIGS: Record<string, SkillConfig> = {
  // === PUBLIC (14 skills) ===
  'pdf': {
    category: Category.INTEGRATION,
    visibility: Visibility.PUBLIC,
    teamId: null,
    authorId: USER_IDS.diana,
    tags: ['pdf', 'documents', 'text-extraction', 'forms'],
  },
  'pptx': {
    category: Category.INTEGRATION,
    visibility: Visibility.PUBLIC,
    teamId: null,
    authorId: USER_IDS.diana,
    tags: ['powerpoint', 'presentations', 'slides', 'office'],
  },
  'docx': {
    category: Category.INTEGRATION,
    visibility: Visibility.PUBLIC,
    teamId: null,
    authorId: USER_IDS.bob,
    tags: ['word', 'documents', 'docx', 'office'],
  },
  'xlsx': {
    category: Category.DATA_ANALYTICS,
    visibility: Visibility.PUBLIC,
    teamId: null,
    authorId: USER_IDS.bob,
    tags: ['excel', 'spreadsheets', 'data', 'formulas'],
  },
  'skill-creator': {
    category: Category.DEVELOPMENT,
    visibility: Visibility.PUBLIC,
    teamId: null,
    authorId: USER_IDS.alice,
    tags: ['skills', 'claude', 'development', 'best-practices'],
  },
  'mcp-builder': {
    category: Category.AI_ML,
    visibility: Visibility.PUBLIC,
    teamId: null,
    authorId: USER_IDS.alice,
    tags: ['mcp', 'claude', 'tools', 'integration'],
  },
  'frontend-design': {
    category: Category.DEVELOPMENT,
    visibility: Visibility.PUBLIC,
    teamId: null,
    authorId: USER_IDS.charlie,
    tags: ['ui', 'ux', 'react', 'tailwind', 'frontend'],
  },
  'webapp-testing': {
    category: Category.TESTING,
    visibility: Visibility.PUBLIC,
    teamId: null,
    authorId: USER_IDS.charlie,
    tags: ['playwright', 'e2e', 'browser', 'automation'],
  },
  'brand-guidelines': {
    category: Category.DEVELOPMENT,
    visibility: Visibility.PUBLIC,
    teamId: null,
    authorId: USER_IDS.alice,
    tags: ['branding', 'design', 'guidelines', 'style'],
  },
  'canvas-design': {
    category: Category.DEVELOPMENT,
    visibility: Visibility.PUBLIC,
    teamId: null,
    authorId: USER_IDS.bob,
    tags: ['canvas', 'graphics', 'design', 'drawing'],
  },
  'doc-coauthoring': {
    category: Category.INTEGRATION,
    visibility: Visibility.PUBLIC,
    teamId: null,
    authorId: USER_IDS.diana,
    tags: ['collaboration', 'documents', 'real-time', 'editing'],
  },
  'internal-comms': {
    category: Category.INTEGRATION,
    visibility: Visibility.PUBLIC,
    teamId: null,
    authorId: USER_IDS.eve,
    tags: ['communications', 'announcements', 'team', 'documentation'],
  },
  'theme-factory': {
    category: Category.DEVELOPMENT,
    visibility: Visibility.PUBLIC,
    teamId: null,
    authorId: USER_IDS.alice,
    tags: ['themes', 'design-systems', 'dark-mode', 'styling'],
  },
  'slack-gif-creator': {
    category: Category.INTEGRATION,
    visibility: Visibility.PUBLIC,
    teamId: null,
    authorId: USER_IDS.charlie,
    tags: ['slack', 'gif', 'animations', 'emoji'],
  },
  // === TEAM_ONLY (1 skill) ===
  'web-artifacts-builder': {
    category: Category.DEVELOPMENT,
    visibility: Visibility.TEAM_ONLY,
    teamId: TEAM_IDS.acme,
    authorId: USER_IDS.eve,
    tags: ['html', 'css', 'javascript', 'widgets'],
  },
  // === PRIVATE (1 skill) ===
  'algorithmic-art': {
    category: Category.AI_ML,
    visibility: Visibility.PRIVATE,
    teamId: null,
    authorId: USER_IDS.diana,
    tags: ['art', 'generative', 'fractals', 'graphics'],
  },
}

// Parse SKILL.md frontmatter
function parseSkillMd(content: string): { name: string; description: string } {
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/)
  if (!frontmatterMatch) {
    throw new Error('No frontmatter found in SKILL.md')
  }

  const frontmatter = frontmatterMatch[1]
  const nameMatch = frontmatter.match(/^name:\s*(.+)$/m)
  const descMatch = frontmatter.match(/^description:\s*["']?(.+?)["']?\s*$/m)

  if (!nameMatch || !descMatch) {
    throw new Error('Missing name or description in frontmatter')
  }

  return {
    name: nameMatch[1].trim(),
    description: descMatch[1].trim().replace(/['"]$/, ''),
  }
}

// Get file MIME type based on extension
function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase()
  const mimeTypes: Record<string, string> = {
    '.md': 'text/markdown',
    '.ts': 'text/typescript',
    '.tsx': 'text/typescript',
    '.js': 'text/javascript',
    '.jsx': 'text/javascript',
    '.py': 'text/x-python',
    '.json': 'application/json',
    '.yaml': 'application/yaml',
    '.yml': 'application/yaml',
    '.txt': 'text/plain',
    '.xml': 'application/xml',
    '.html': 'text/html',
    '.css': 'text/css',
    '.sh': 'text/x-shellscript',
  }
  return mimeTypes[ext] || 'application/octet-stream'
}

// Store for created skill IDs
const createdSkillIds: Record<string, string> = {}
const createdSkillVersionIds: Record<string, string> = {}

async function clearDatabase() {
  console.log('🗑️  Clearing existing data...')

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

async function seedSkillsFromZips() {
  console.log('📦 Seeding skills from real zip files...')

  // Get user emailPrefix mapping
  const users = await prisma.user.findMany({ select: { id: true, emailPrefix: true } })
  const userEmailPrefix: Record<string, string> = {}
  for (const user of users) {
    userEmailPrefix[user.id] = user.emailPrefix
  }

  const zipFiles = fs.readdirSync(TEST_SKILLS_DIR)
    .filter(f => f.endsWith('.zip'))
    .map(f => f.replace('.zip', ''))

  let skillCount = 0
  let versionCount = 0
  let fileCount = 0

  for (const skillName of zipFiles) {
    const config = SKILL_CONFIGS[skillName]
    if (!config) {
      console.log(`   ⚠️  No config for ${skillName}, skipping...`)
      continue
    }

    const zipPath = path.join(TEST_SKILLS_DIR, `${skillName}.zip`)
    const zipBuffer = fs.readFileSync(zipPath)

    console.log(`   Processing ${skillName}.zip...`)

    // Parse the zip
    const zip = await JSZip.loadAsync(zipBuffer)

    // Extract SKILL.md
    const skillMdFile = zip.file('SKILL.md')
    if (!skillMdFile) {
      console.log(`   ⚠️  No SKILL.md in ${skillName}, skipping...`)
      continue
    }

    const skillMdContent = await skillMdFile.async('string')
    const { name, description } = parseSkillMd(skillMdContent)

    // Create skill record
    const skillId = `skill-${skillName}`
    createdSkillIds[skillName] = skillId
    const slug = generateSkillSlug(skillName)
    const fullSlug = generateFullSlug(userEmailPrefix[config.authorId] || 'unknown', slug)

    // Determine status based on visibility and risk
    let status = SkillStatus.APPROVED

    await prisma.skill.create({
      data: {
        id: skillId,
        name,
        slug,
        fullSlug,
        description,
        category: config.category,
        tags: config.tags,
        authorId: config.authorId,
        teamId: config.teamId,
        visibility: config.visibility,
      },
    })
    skillCount++

    // Create skill version - use correct storage key format
    const skillVersionId = `sv-${skillName}-1`
    createdSkillVersionIds[skillName] = skillVersionId
    const storageKey = `skills/${skillId}/1.0.0.zip`

    // Upload to storage provider
    console.log(`   📤 Uploading ${skillName} to storage...`)
    await storage.upload(storageKey, zipBuffer, { contentType: 'application/zip' })

    await prisma.skillVersion.create({
      data: {
        id: skillVersionId,
        skillId,
        version: '1.0.0',
        changelog: 'Initial release',
        filePath: storageKey,
        status,
        createdBy: config.authorId,
      },
    })
    versionCount++

    // Run actual security scan
    console.log(`   🔍 Running security scan for ${skillName}...`)
    const securityReport = await scanSkill(zipBuffer)

    // Store security scan result
    await prisma.securityScan.create({
      data: {
        id: `ss-${skillName}-1`,
        skillVersionId,
        status: JobStatus.COMPLETED,
        score: securityReport.riskLevel === 'critical' ? 0 :
               securityReport.riskLevel === 'high' ? 25 :
               securityReport.riskLevel === 'medium' ? 50 : 75,
        reportJson: JSON.parse(JSON.stringify(securityReport)),
        completedAt: new Date(),
      },
    })

    // Update skill version status based on security risk
    if (securityReport.riskLevel === 'critical') {
      await prisma.skillVersion.update({
        where: { id: skillVersionId },
        data: { status: SkillStatus.REJECTED },
      })
    }

    // Create skill files from zip contents
    for (const [filePath, zipEntry] of Object.entries(zip.files)) {
      if (zipEntry.dir) continue

      const mimeType = getMimeType(filePath)
      const isText = mimeType.startsWith('text/') ||
                     mimeType === 'application/json' ||
                     mimeType === 'application/yaml' ||
                     mimeType === 'application/xml'

      let content: string | null = null
      if (isText) {
        try {
          content = await zipEntry.async('string')
        } catch {
          // Skip binary files
          continue
        }
      }

      // Get file size - use async method for accurate size
      let sizeBytes = 0
      try {
        const fileData = await zipEntry.async('uint8array')
        sizeBytes = fileData.length
      } catch {
        sizeBytes = 0
      }

      await prisma.skillFile.create({
        data: {
          id: `sf-${skillName}-${randomUUID().slice(0, 8)}`,
          skillVersionId,
          filePath,
          fileType: mimeType,
          sizeBytes,
          content: content || undefined,
        },
      })
      fileCount++
    }

    // Create skill stats
    const baseDownloads = config.visibility === Visibility.PUBLIC ? 1000 + Math.floor(Math.random() * 3000) :
                          config.visibility === Visibility.TEAM_ONLY ? 50 + Math.floor(Math.random() * 200) :
                          10 + Math.floor(Math.random() * 50)

    await prisma.skillStat.create({
      data: {
        id: `stat-${skillName}`,
        skillId,
        downloadsCount: baseDownloads,
        viewsCount: baseDownloads * 5 + Math.floor(Math.random() * 1000),
        lastDownloadedAt: new Date(Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)),
        lastViewedAt: new Date(Date.now() - Math.floor(Math.random() * 24 * 60 * 60 * 1000)),
      },
    })
  }

  console.log(`   Created ${skillCount} skills, ${versionCount} versions, ${fileCount} files`)
}

async function seedBundles() {
  console.log('📚 Seeding skill bundles...')

  // Define bundles: 3 PUBLIC, 1 TEAM_ONLY
  const bundles = [
    {
      id: 'bundle-document-suite',
      name: 'Document Suite',
      slug: 'document-suite',
      description: 'Complete document handling - PDF, Word, Excel, and PowerPoint manipulation for all your document needs.',
      visibility: Visibility.PUBLIC,
      teamId: null,
      skills: ['pdf', 'docx', 'xlsx', 'pptx'],
    },
    {
      id: 'bundle-dev-toolkit',
      name: 'Developer Toolkit',
      slug: 'developer-toolkit',
      description: 'Essential development tools - skill creation, MCP building, and frontend design assistance.',
      visibility: Visibility.PUBLIC,
      teamId: null,
      skills: ['skill-creator', 'mcp-builder', 'frontend-design', 'webapp-testing'],
    },
    {
      id: 'bundle-creative-tools',
      name: 'Creative Tools',
      slug: 'creative-tools',
      description: 'Creative tools for design, themes, and visual content generation.',
      visibility: Visibility.PUBLIC,
      teamId: null,
      skills: ['brand-guidelines', 'canvas-design', 'theme-factory', 'slack-gif-creator'],
    },
    {
      id: 'bundle-team-collab',
      name: 'Team Collaboration',
      slug: 'team-collab',
      description: 'Team collaboration tools for document coauthoring, communications, and web artifacts.',
      visibility: Visibility.TEAM_ONLY,
      teamId: TEAM_IDS.acme,
      skills: ['doc-coauthoring', 'internal-comms', 'web-artifacts-builder'],
    },
  ]

  let bundleCount = 0
  let bundleSkillCount = 0

  for (const bundle of bundles) {
    // Only create bundle if all skills exist
    const skillIds = bundle.skills
      .map(s => createdSkillIds[s])
      .filter(Boolean)

    if (skillIds.length === 0) {
      console.log(`   ⚠️  No skills found for ${bundle.name}, skipping...`)
      continue
    }

    await prisma.skillBundle.create({
      data: {
        id: bundle.id,
        name: bundle.name,
        slug: bundle.slug,
        description: bundle.description,
        visibility: bundle.visibility,
        teamId: bundle.teamId,
      },
    })
    bundleCount++

    for (const skillId of skillIds) {
      await prisma.bundleSkill.create({
        data: {
          id: `bs-${bundle.slug}-${skillId}`,
          bundleId: bundle.id,
          skillId,
        },
      })
      bundleSkillCount++
    }
  }

  console.log(`   Created ${bundleCount} bundles with ${bundleSkillCount} skill associations`)
}

async function seedMockEvaluations() {
  console.log('🧪 Seeding mock evaluations...')

  // Create some eval queues for specific skills
  const evalQueues = [
    { skillName: 'pdf', status: JobStatus.COMPLETED },
    { skillName: 'pptx', status: JobStatus.COMPLETED },
    { skillName: 'docx', status: JobStatus.PENDING },
    { skillName: 'frontend-design', status: JobStatus.RUNNING },
    { skillName: 'algorithmic-art', status: JobStatus.FAILED, error: 'Memory limit exceeded during fractal generation' },
  ]

  for (const eq of evalQueues) {
    const skillVersionId = createdSkillVersionIds[eq.skillName]
    if (!skillVersionId) continue

    const now = new Date()
    const startedAt = eq.status !== JobStatus.PENDING ? new Date(now.getTime() - 5 * 60 * 1000) : null
    const completedAt = eq.status === JobStatus.COMPLETED || eq.status === JobStatus.FAILED
      ? new Date(now.getTime() - 4 * 60 * 1000)
      : null

    const evalQueue = await prisma.evalQueue.create({
      data: {
        id: `eq-${eq.skillName}`,
        skillVersionId,
        status: eq.status,
        priority: 5,
        startedAt,
        completedAt,
        error: eq.error,
      },
    })

    // Create mock eval results for completed/failed evaluations
    if (eq.status === JobStatus.COMPLETED || eq.status === JobStatus.FAILED) {
      const testNames = [
        'Basic functionality test',
        'Input validation test',
        'Error handling test',
        'Integration test',
      ]

      for (let i = 0; i < testNames.length; i++) {
        const passed = eq.status === JobStatus.COMPLETED ? Math.random() > 0.2 : i < 2
        await prisma.evalResult.create({
          data: {
            id: `er-${eq.skillName}-${i}`,
            evalQueueId: evalQueue.id,
            testName: testNames[i],
            status: passed ? TestStatus.PASSED : TestStatus.FAILED,
            output: passed
              ? 'Test completed successfully'
              : 'Test failed due to unexpected error',
            durationMs: Math.floor(Math.random() * 1000) + 100,
          },
        })
      }
    }
  }

  console.log(`   Created ${evalQueues.length} mock eval jobs`)
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

  // Get security scan summary
  const scans = await prisma.securityScan.findMany({
    select: { reportJson: true },
  })

  const riskLevels = { critical: 0, high: 0, medium: 0, low: 0 }
  for (const scan of scans) {
    const report = JSON.parse(JSON.stringify(scan.reportJson)) as SecurityReport
    if (report?.riskLevel && report.riskLevel in riskLevels) {
      riskLevels[report.riskLevel as keyof typeof riskLevels]++
    }
  }

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

  Security Risk Distribution:
    Critical: ${riskLevels.critical}
    High:     ${riskLevels.high}
    Medium:   ${riskLevels.medium}
    Low:      ${riskLevels.low}
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
  console.log('\n🌱 Starting database seed with REAL skill data...\n')

  try {
    await clearDatabase()
    await seedUsers()
    await seedTeams()
    await seedSkillsFromZips()
    await seedBundles()
    await seedMockEvaluations()
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
