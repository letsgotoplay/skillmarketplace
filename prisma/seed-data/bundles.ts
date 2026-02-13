import { Visibility } from '@prisma/client'
import { TEAM_IDS } from './teams'
import { SKILL_IDS } from './skills'

export const SKILL_BUNDLES = [
  {
    id: 'bundle-document-suite',
    name: 'Document Suite',
    slug: 'document-suite',
    description: 'Complete document handling - PDF, Word, Excel, and PowerPoint manipulation for all your document needs.',
    teamId: null,
    visibility: Visibility.PUBLIC,
  },
  {
    id: 'bundle-dev-toolkit',
    name: 'Developer Toolkit',
    slug: 'developer-toolkit',
    description: 'Essential development tools - skill creation, MCP building, and frontend design assistance.',
    teamId: null,
    visibility: Visibility.PUBLIC,
  },
  {
    id: 'bundle-brand-studio',
    name: 'Brand Studio',
    slug: 'brand-studio',
    description: 'Build and maintain your brand identity with guidelines and design tools.',
    teamId: TEAM_IDS.acme,
    visibility: Visibility.TEAM_ONLY,
  },
  {
    id: 'bundle-collab-hub',
    name: 'Collaboration Hub',
    slug: 'collaboration-hub',
    description: 'Team collaboration tools for document coauthoring and internal communications.',
    teamId: TEAM_IDS.startup,
    visibility: Visibility.TEAM_ONLY,
  },
]

export const BUNDLE_SKILLS = [
  // Document Suite bundle
  { id: 'bs-ds-1', bundleId: 'bundle-document-suite', skillId: SKILL_IDS.pdf },
  { id: 'bs-ds-2', bundleId: 'bundle-document-suite', skillId: SKILL_IDS.docx },
  { id: 'bs-ds-3', bundleId: 'bundle-document-suite', skillId: SKILL_IDS.xlsx },
  { id: 'bs-ds-4', bundleId: 'bundle-document-suite', skillId: SKILL_IDS.pptx },
  // Developer Toolkit bundle
  { id: 'bs-dt-1', bundleId: 'bundle-dev-toolkit', skillId: SKILL_IDS.skillCreator },
  { id: 'bs-dt-2', bundleId: 'bundle-dev-toolkit', skillId: SKILL_IDS.mcpBuilder },
  { id: 'bs-dt-3', bundleId: 'bundle-dev-toolkit', skillId: SKILL_IDS.frontendDesign },
  { id: 'bs-dt-4', bundleId: 'bundle-dev-toolkit', skillId: SKILL_IDS.webappTesting },
  // Brand Studio bundle
  { id: 'bs-br-1', bundleId: 'bundle-brand-studio', skillId: SKILL_IDS.brandGuidelines },
  { id: 'bs-br-2', bundleId: 'bundle-brand-studio', skillId: SKILL_IDS.canvasDesign },
  { id: 'bs-br-3', bundleId: 'bundle-brand-studio', skillId: SKILL_IDS.themeFactory },
  // Collaboration Hub bundle
  { id: 'bs-ch-1', bundleId: 'bundle-collab-hub', skillId: SKILL_IDS.docCoauthoring },
  { id: 'bs-ch-2', bundleId: 'bundle-collab-hub', skillId: SKILL_IDS.internalComms },
]

export const BUNDLE_IDS = {
  documentSuite: 'bundle-document-suite',
  devToolkit: 'bundle-dev-toolkit',
  brandStudio: 'bundle-brand-studio',
  collabHub: 'bundle-collab-hub',
}
