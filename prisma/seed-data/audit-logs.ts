import { USER_IDS } from './users'
import { SKILL_IDS } from './skills'
import { TEAM_IDS } from './teams'
import { BUNDLE_IDS } from './bundles'

export const AUDIT_LOGS = [
  // User login events
  { id: 'al-001', userId: USER_IDS.admin, action: 'LOGIN', resource: 'session', resourceId: null, metadata: { ip: '192.168.1.1', userAgent: 'Chrome/120' } },
  { id: 'al-002', userId: USER_IDS.alice, action: 'LOGIN', resource: 'session', resourceId: null, metadata: { ip: '192.168.1.2', userAgent: 'Firefox/121' } },
  { id: 'al-003', userId: USER_IDS.bob, action: 'LOGIN', resource: 'session', resourceId: null, metadata: { ip: '192.168.1.3', userAgent: 'Safari/17' } },
  // Skill events - using new Anthropic skills
  { id: 'al-004', userId: USER_IDS.diana, action: 'SKILL_CREATE', resource: 'skill', resourceId: SKILL_IDS.pdf, metadata: { name: 'pdf' } },
  { id: 'al-005', userId: USER_IDS.diana, action: 'SKILL_CREATE', resource: 'skill', resourceId: SKILL_IDS.pptx, metadata: { name: 'pptx' } },
  { id: 'al-006', userId: USER_IDS.bob, action: 'SKILL_CREATE', resource: 'skill', resourceId: SKILL_IDS.docx, metadata: { name: 'docx' } },
  { id: 'al-007', userId: USER_IDS.charlie, action: 'SKILL_DOWNLOAD', resource: 'skill', resourceId: SKILL_IDS.pdf, metadata: { version: '1.1.0' } },
  { id: 'al-008', userId: USER_IDS.eve, action: 'SKILL_DOWNLOAD', resource: 'skill', resourceId: SKILL_IDS.frontendDesign, metadata: { version: '1.0.0' } },
  { id: 'al-009', userId: USER_IDS.diana, action: 'SKILL_VERSION_CREATE', resource: 'skill_version', resourceId: 'sv-pdf-2', metadata: { version: '1.1.0' } },
  { id: 'al-010', userId: USER_IDS.bob, action: 'SKILL_VERSION_CREATE', resource: 'skill_version', resourceId: 'sv-docx-2', metadata: { version: '2.0.0' } },
  { id: 'al-011', userId: USER_IDS.alice, action: 'SKILL_CREATE', resource: 'skill', resourceId: SKILL_IDS.skillCreator, metadata: { name: 'skill-creator' } },
  { id: 'al-012', userId: USER_IDS.alice, action: 'SKILL_CREATE', resource: 'skill', resourceId: SKILL_IDS.mcpBuilder, metadata: { name: 'mcp-builder' } },
  { id: 'al-013', userId: USER_IDS.charlie, action: 'SKILL_CREATE', resource: 'skill', resourceId: SKILL_IDS.frontendDesign, metadata: { name: 'frontend-design' } },
  { id: 'al-014', userId: USER_IDS.charlie, action: 'SKILL_CREATE', resource: 'skill', resourceId: SKILL_IDS.webappTesting, metadata: { name: 'webapp-testing' } },
  // Team events
  { id: 'al-015', userId: USER_IDS.alice, action: 'TEAM_CREATE', resource: 'team', resourceId: TEAM_IDS.acme, metadata: { name: 'Acme Corp' } },
  { id: 'al-016', userId: USER_IDS.alice, action: 'TEAM_MEMBER_ADD', resource: 'team_member', resourceId: 'tm-acme-bob', metadata: { teamName: 'Acme Corp', userName: 'Bob Smith' } },
  { id: 'al-017', userId: USER_IDS.alice, action: 'TEAM_MEMBER_ADD', resource: 'team_member', resourceId: 'tm-acme-charlie', metadata: { teamName: 'Acme Corp', userName: 'Charlie Brown' } },
  { id: 'al-018', userId: USER_IDS.diana, action: 'TEAM_CREATE', resource: 'team', resourceId: TEAM_IDS.startup, metadata: { name: 'Startup Labs' } },
  { id: 'al-019', userId: USER_IDS.diana, action: 'TEAM_MEMBER_ADD', resource: 'team_member', resourceId: 'tm-startup-eve', metadata: { teamName: 'Startup Labs', userName: 'Eve Williams' } },
  // Bundle events
  { id: 'al-020', userId: USER_IDS.admin, action: 'BUNDLE_CREATE', resource: 'bundle', resourceId: BUNDLE_IDS.documentSuite, metadata: { name: 'Document Suite' } },
  { id: 'al-021', userId: USER_IDS.admin, action: 'BUNDLE_CREATE', resource: 'bundle', resourceId: BUNDLE_IDS.devToolkit, metadata: { name: 'Developer Toolkit' } },
  { id: 'al-022', userId: USER_IDS.charlie, action: 'BUNDLE_DOWNLOAD', resource: 'bundle', resourceId: BUNDLE_IDS.documentSuite, metadata: { skillCount: 4 } },
  { id: 'al-023', userId: USER_IDS.eve, action: 'BUNDLE_DOWNLOAD', resource: 'bundle', resourceId: BUNDLE_IDS.devToolkit, metadata: { skillCount: 4 } },
  // Security events
  { id: 'al-024', userId: USER_IDS.diana, action: 'SECURITY_SCAN_TRIGGER', resource: 'security_scan', resourceId: 'ss-pdf-2', metadata: { skillName: 'pdf', version: '1.1.0' } },
  { id: 'al-025', userId: USER_IDS.alice, action: 'SECURITY_SCAN_TRIGGER', resource: 'security_scan', resourceId: 'ss-skill-creator-1', metadata: { skillName: 'skill-creator', version: '1.0.0' } },
  { id: 'al-026', userId: USER_IDS.charlie, action: 'SECURITY_SCAN_TRIGGER', resource: 'security_scan', resourceId: 'ss-webapp-testing-1', metadata: { skillName: 'webapp-testing', version: '1.0.0' } },
  { id: 'al-027', userId: USER_IDS.diana, action: 'SECURITY_SCAN_TRIGGER', resource: 'security_scan', resourceId: 'ss-algorithmic-art-1', metadata: { skillName: 'algorithmic-art', version: '1.0.0' } },
]

export function getAuditLogsWithDates() {
  const now = new Date()
  return AUDIT_LOGS.map((log, index) => ({
    ...log,
    createdAt: new Date(now.getTime() - (AUDIT_LOGS.length - index) * 3600000), // Spread over hours
  }))
}
