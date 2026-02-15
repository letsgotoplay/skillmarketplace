import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Terminal,
  Database,
  Server,
  Container,
  FolderTree,
  TestTube,
  ArrowRight,
  Code2,
  Cloud,
  Zap,
  Settings,
  FileJson,
  Shield,
  Layers,
} from 'lucide-react';

export default function DeveloperGuidePage() {
  return (
    <div className="container mx-auto py-8 max-w-4xl">
      {/* Breadcrumb */}
      <div className="mb-6">
        <Link href="/blog" className="text-sm text-muted-foreground hover:text-foreground">
          &larr; Back to Blog
        </Link>
      </div>

      {/* Article Header */}
      <article>
        <header className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Badge variant="secondary">Documentation</Badge>
            <Badge variant="outline">Developer</Badge>
            <span className="text-sm text-muted-foreground">February 2026</span>
          </div>
          <h1 className="text-4xl font-bold mb-4">
            Developer Guide: Local Setup & Operations
          </h1>
          <p className="text-xl text-muted-foreground">
            A comprehensive guide for developers to set up, run, and operate the SkillHub
            marketplace locally. Covers Prisma database, MinIO storage, Redis queues, and more.
          </p>
        </header>

        {/* Quick Navigation */}
        <div className="mb-8 p-4 bg-muted rounded-lg">
          <h3 className="font-semibold mb-2">Quick Navigation</h3>
          <div className="flex flex-wrap gap-2">
            <a href="#prerequisites" className="text-sm text-primary hover:underline">Prerequisites</a>
            <span className="text-muted-foreground">|</span>
            <a href="#local-setup" className="text-sm text-primary hover:underline">Local Setup</a>
            <span className="text-muted-foreground">|</span>
            <a href="#database" className="text-sm text-primary hover:underline">Database</a>
            <span className="text-muted-foreground">|</span>
            <a href="#minio" className="text-sm text-primary hover:underline">MinIO</a>
            <span className="text-muted-foreground">|</span>
            <a href="#testing" className="text-sm text-primary hover:underline">Testing</a>
            <span className="text-muted-foreground">|</span>
            <a href="#project-structure" className="text-sm text-primary hover:underline">Project Structure</a>
          </div>
        </div>

        {/* Article Content */}
        <div className="prose prose-neutral dark:prose-invert max-w-none">

          {/* Prerequisites */}
          <section className="mb-12" id="prerequisites">
            <h2 className="flex items-center gap-2">
              <Container className="h-6 w-6 text-primary" />
              Prerequisites
            </h2>
            <p>Before starting, ensure you have the following installed:</p>
          </section>

          <section className="mb-12">
            <Card>
              <CardContent className="pt-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Container className="h-4 w-4" /> Docker & Docker Compose
                    </h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Required for PostgreSQL, Redis, and sandbox containers
                    </p>
                    <code className="text-xs bg-background px-2 py-1 rounded">docker --version</code>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Terminal className="h-4 w-4" /> Node.js 18+
                    </h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Runtime environment for Next.js
                    </p>
                    <code className="text-xs bg-background px-2 py-1 rounded">node --version</code>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Zap className="h-4 w-4" /> pnpm
                    </h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Package manager (required)
                    </p>
                    <code className="text-xs bg-background px-2 py-1 rounded">pnpm --version</code>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Database className="h-4 w-4" /> Prisma CLI
                    </h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Database ORM (installed via pnpm)
                    </p>
                    <code className="text-xs bg-background px-2 py-1 rounded">npx prisma --version</code>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Local Setup */}
          <section className="mb-12" id="local-setup">
            <h2 className="flex items-center gap-2">
              <Server className="h-6 w-6 text-primary" />
              Local Setup
            </h2>
          </section>

          <section className="mb-12">
            <Card className="mb-4">
              <CardHeader>
                <CardTitle className="text-lg">Step 1: Clone & Install</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
{`git clone <repository-url>
cd skillmarketplace
pnpm install`}
                </pre>
              </CardContent>
            </Card>

            <Card className="mb-4">
              <CardHeader>
                <CardTitle className="text-lg">Step 2: Environment Configuration</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4">Copy the example environment file and configure:</p>
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
{`cp .env.example .env`}
                </pre>
                <p className="mt-4 text-sm text-muted-foreground">
                  Key environment variables (defaults work for local development):
                </p>
                <ul className="text-sm mt-2">
                  <li><code>DATABASE_URL</code> - PostgreSQL connection string</li>
                  <li><code>REDIS_URL</code> - Redis connection for BullMQ queues</li>
                  <li><code>S3_*</code> - MinIO/S3 storage configuration</li>
                  <li><code>AI_SECURITY_*</code> - AI model for security analysis</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="mb-4">
              <CardHeader>
                <CardTitle className="text-lg">Step 3: Start Infrastructure</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
{`# Start PostgreSQL, Redis, and Sandbox containers
docker-compose up -d

# Start MinIO (separate command for local storage)
pnpm minio:start`}
                </pre>
              </CardContent>
            </Card>

            <Card className="mb-4">
              <CardHeader>
                <CardTitle className="text-lg">Step 4: Database Setup</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
{`# Generate Prisma client
pnpm db:generate

# Run database migrations
pnpm db:migrate

# (Optional) Seed sample data
pnpm db:seed`}
                </pre>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Step 5: Start Development Server</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
{`pnpm dev`}
                </pre>
                <p className="mt-4 text-sm text-muted-foreground">
                  Open <a href="http://localhost:3000" className="text-primary hover:underline">http://localhost:3000</a> in your browser.
                </p>
              </CardContent>
            </Card>
          </section>

          {/* Database Section */}
          <section className="mb-12" id="database">
            <h2 className="flex items-center gap-2">
              <Database className="h-6 w-6 text-primary" />
              Prisma Database Operations
            </h2>
            <p className="text-lg">
              Prisma is our ORM for PostgreSQL. Here&apos;s how to work with it effectively.
            </p>
          </section>

          <section className="mb-12 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Prisma Studio (GUI)
                </CardTitle>
                <CardDescription>
                  Visual database browser and editor
                </CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm mb-4">
{`# Open Prisma Studio on custom port (recommended: 5556)
npx prisma studio --port 5556`}
                </pre>
                <p className="text-sm text-muted-foreground">
                  Opens a web GUI at <code>http://localhost:5556</code> where you can:
                </p>
                <ul className="text-sm mt-2">
                  <li>Browse all tables and records</li>
                  <li>Edit, create, and delete records</li>
                  <li>Filter and sort data</li>
                  <li>View relationships between models</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileJson className="h-5 w-5" />
                  Common Commands
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm font-medium mb-1">Generate Prisma Client</p>
                    <code className="text-xs">pnpm db:generate</code>
                    <p className="text-xs text-muted-foreground mt-1">
                      Run after schema changes to update the TypeScript client
                    </p>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm font-medium mb-1">Create & Run Migration</p>
                    <code className="text-xs">pnpm db:migrate</code>
                    <p className="text-xs text-muted-foreground mt-1">
                      Creates a new migration and applies it to the database
                    </p>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm font-medium mb-1">Push Schema (Development)</p>
                    <code className="text-xs">pnpm db:push</code>
                    <p className="text-xs text-muted-foreground mt-1">
                      Push schema changes without creating migrations (fast prototyping)
                    </p>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm font-medium mb-1">Reset Database</p>
                    <code className="text-xs">npx prisma migrate reset</code>
                    <p className="text-xs text-muted-foreground mt-1">
                      Drops all data and reapplies all migrations (destructive!)
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code2 className="h-5 w-5" />
                  Querying with Prisma Client
                </CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
{`import { prisma } from '@/lib/prisma';

// Find all skills with filtering
const skills = await prisma.skill.findMany({
  where: { visibility: 'PUBLIC' },
  include: { author: true, versions: true },
  orderBy: { createdAt: 'desc' },
  take: 10,
});

// Create a new skill
const skill = await prisma.skill.create({
  data: {
    name: 'My Skill',
    slug: 'my-skill',
    authorId: userId,
    visibility: 'PUBLIC',
  },
});

// Update with relations
await prisma.skill.update({
  where: { id: skillId },
  data: { description: 'Updated description' },
});`}
                </pre>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FolderTree className="h-5 w-5" />
                  Schema Overview
                </CardTitle>
                <CardDescription>
                  Key models in our database
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-3">
                  <div className="p-3 bg-muted rounded-lg">
                    <h4 className="font-medium text-sm">User & Auth</h4>
                    <p className="text-xs text-muted-foreground">User, UserRole, NextAuth</p>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <h4 className="font-medium text-sm">Skills</h4>
                    <p className="text-xs text-muted-foreground">Skill, SkillVersion, SkillFile</p>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <h4 className="font-medium text-sm">Teams</h4>
                    <p className="text-xs text-muted-foreground">Team, TeamMember, TeamRole</p>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <h4 className="font-medium text-sm">Security</h4>
                    <p className="text-xs text-muted-foreground">SecurityScan, SecurityConfig</p>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <h4 className="font-medium text-sm">Evaluation</h4>
                    <p className="text-xs text-muted-foreground">EvalQueue, EvalResult</p>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <h4 className="font-medium text-sm">Bundles</h4>
                    <p className="text-xs text-muted-foreground">SkillBundle, BundleSkill</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* MinIO Section */}
          <section className="mb-12" id="minio">
            <h2 className="flex items-center gap-2">
              <Cloud className="h-6 w-6 text-primary" />
              MinIO Object Storage
            </h2>
            <p className="text-lg">
              MinIO provides S3-compatible local storage for skill files and uploads.
            </p>
          </section>

          <section className="mb-12 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Starting & Managing MinIO</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm mb-4">
{`# Start MinIO container
pnpm minio:start

# Open MinIO Console in browser
pnpm minio:console
# Or visit: http://localhost:9001

# View MinIO logs
pnpm minio:logs

# Stop and remove MinIO container
pnpm minio:stop`}
                </pre>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">MinIO Console Credentials</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-medium mb-2">Access Key</h4>
                    <code className="text-sm">minioadmin</code>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-medium mb-2">Secret Key</h4>
                    <code className="text-sm">minioadmin123</code>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-4">
                  These are defined in <code>.env</code> and <code>package.json</code> scripts.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Using MinIO Console</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm space-y-2">
                  <li><strong>Buckets:</strong> Create/view S3 buckets (default: <code>skillmarketplace</code>)</li>
                  <li><strong>Browse:</strong> Navigate uploaded skill ZIP files</li>
                  <li><strong>Upload/Download:</strong> Manually manage stored files</li>
                  <li><strong>Access Policy:</strong> Set bucket visibility settings</li>
                </ul>
              </CardContent>
            </Card>
          </section>

          {/* Redis & Queues */}
          <section className="mb-12" id="queues">
            <h2 className="flex items-center gap-2">
              <Zap className="h-6 w-6 text-primary" />
              Redis & Job Queues
            </h2>
            <p className="text-lg">
              BullMQ with Redis handles async processing for evaluations and security scans.
            </p>
          </section>

          <section className="mb-12">
            <Card>
              <CardHeader>
                <CardTitle>Queue System</CardTitle>
                <CardDescription>Background job processing</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Shield className="h-4 w-4" /> Security Scans
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Queued when a skill is uploaded. Runs pattern-based and AI security analysis.
                    </p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Layers className="h-4 w-4" /> Evaluations
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Queued when a skill with test cases is uploaded. Executes tests in sandbox.
                    </p>
                  </div>
                </div>
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
{`# Check Redis connection
docker exec -it skillmarketplace-redis redis-cli ping
# Should return: PONG

# Monitor Redis commands (useful for debugging)
docker exec -it skillmarketplace-redis redis-cli monitor`}
                </pre>
              </CardContent>
            </Card>
          </section>

          {/* Testing Section */}
          <section className="mb-12" id="testing">
            <h2 className="flex items-center gap-2">
              <TestTube className="h-6 w-6 text-primary" />
              Testing
            </h2>
          </section>

          <section className="mb-12 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Unit & Integration Tests</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
{`# Run all unit tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage report
pnpm test:coverage`}
                </pre>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">E2E Tests (Agent Browser)</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm mb-4">
{`# Run agent-browser E2E tests
agent-browser --executable-path "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" <commands>

# Test plans are in tests/e2e/*.md files
# Run specific test scenario by following the steps in the markdown`}
                </pre>
                <p className="text-sm text-muted-foreground mb-2">
                  E2E tests are documented as step-by-step plans in <code>tests/e2e/</code>:
                </p>
                <ul className="text-sm text-muted-foreground">
                  <li>Test plans in markdown format (00-overview.md, 01-*, etc.)</li>
                  <li>Sample profiles and skill fixtures in <code>tests/e2e/fixtures/</code></li>
                  <li>Test users: admin/alice/bob @example.com</li>
                </ul>
              </CardContent>
            </Card>
          </section>

          {/* Project Structure */}
          <section className="mb-12" id="project-structure">
            <h2 className="flex items-center gap-2">
              <FolderTree className="h-6 w-6 text-primary" />
              Project Structure
            </h2>
          </section>

          <section className="mb-12">
            <Card>
              <CardContent className="pt-6">
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
{`skillmarketplace/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # Auth pages (login, register)
│   │   ├── (marketplace)/     # Main marketplace pages
│   │   │   ├── blog/          # Blog pages
│   │   │   ├── docs/          # Documentation pages
│   │   │   ├── marketplace/   # Skill browsing
│   │   │   └── skills/        # Skill detail pages
│   │   └── api/               # API routes
│   ├── components/            # React components
│   │   └── ui/                # shadcn/ui components
│   ├── lib/                   # Core libraries
│   │   ├── prisma.ts         # Prisma client
│   │   ├── skills/           # Skill handling logic
│   │   ├── security/         # Security scanning
│   │   └── queues/           # BullMQ queue setup
│   └── types/                 # TypeScript types
├── prisma/
│   ├── schema.prisma         # Database schema
│   └── seed.ts               # Database seeding
├── tests/
│   ├── e2e/                  # Agent Browser E2E test plans
│   │   ├── fixtures/         # Test skill zip files
│   │   └── *.md              # Step-by-step test scenarios
│   └── unit/                 # Jest unit tests
├── docs/
│   └── features/             # Feature documentation
├── docker/
│   └── sandbox/              # Sandbox container for evals
├── docker-compose.yml        # Development infrastructure
├── .env.example              # Environment template
└── package.json              # Scripts and dependencies`}
                </pre>
              </CardContent>
            </Card>
          </section>

          {/* Common Commands Reference */}
          <section className="mb-12">
            <h2>Quick Command Reference</h2>
            <Card>
              <CardContent className="pt-6">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 pr-4">Command</th>
                        <th className="text-left py-2">Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      <tr><td className="py-2 pr-4"><code>pnpm dev</code></td><td>Start development server</td></tr>
                      <tr><td className="py-2 pr-4"><code>pnpm build</code></td><td>Build for production</td></tr>
                      <tr><td className="py-2 pr-4"><code>pnpm db:studio</code></td><td>Open Prisma Studio</td></tr>
                      <tr><td className="py-2 pr-4"><code>pnpm db:migrate</code></td><td>Run database migration</td></tr>
                      <tr><td className="py-2 pr-4"><code>pnpm db:seed</code></td><td>Seed sample data</td></tr>
                      <tr><td className="py-2 pr-4"><code>pnpm minio:start</code></td><td>Start MinIO storage</td></tr>
                      <tr><td className="py-2 pr-4"><code>pnpm minio:console</code></td><td>Open MinIO Console</td></tr>
                      <tr><td className="py-2 pr-4"><code>pnpm test</code></td><td>Run unit tests</td></tr>
                      <tr><td className="py-2 pr-4"><code>agent-browser ...</code></td><td>Run E2E tests (agent-browser CLI)</td></tr>
                      <tr><td className="py-2 pr-4"><code>docker-compose up -d</code></td><td>Start infra containers</td></tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Troubleshooting */}
          <section className="mb-12">
            <h2>Common Issues & Solutions</h2>
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Database Connection Error</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm mb-2">Ensure PostgreSQL is running:</p>
                  <code className="text-xs bg-muted px-2 py-1 rounded">docker-compose up -d postgres</code>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Prisma Client Not Generated</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm mb-2">Regenerate the client:</p>
                  <code className="text-xs bg-muted px-2 py-1 rounded">pnpm db:generate</code>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">MinIO Bucket Not Found</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm mb-2">Create the bucket via MinIO Console at <code>http://localhost:9001</code></p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Queue Jobs Not Processing</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm mb-2">Check Redis connection and restart workers:</p>
                  <code className="text-xs bg-muted px-2 py-1 rounded">docker-compose restart redis</code>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">E2E Tests Failing</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm mb-2">Ensure dev server is running and database is seeded:</p>
                  <code className="text-xs bg-muted px-2 py-1 rounded">pnpm dev && pnpm db:seed</code>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* CTA */}
          <section className="mb-12">
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="py-8">
                <h3 className="text-xl font-bold mb-2">Need More Help?</h3>
                <p className="text-muted-foreground mb-4">
                  Check out the full documentation or browse the API reference for detailed endpoint information.
                </p>
                <div className="flex gap-4 flex-wrap">
                  <Link href="/docs/getting-started">
                    <Button size="lg">
                      Getting Started
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/docs/api">
                    <Button size="lg" variant="outline">
                      API Reference
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Related Articles */}
          <section>
            <h3 className="text-lg font-semibold mb-4">Related Resources</h3>
            <div className="grid md:grid-cols-3 gap-4 not-prose">
              <Link href="/docs/specification">
                <Card className="h-full hover:border-primary transition-colors cursor-pointer">
                  <CardHeader>
                    <CardTitle className="text-base">Skill Specification</CardTitle>
                    <CardDescription>Learn the skill format</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
              <Link href="/docs/api">
                <Card className="h-full hover:border-primary transition-colors cursor-pointer">
                  <CardHeader>
                    <CardTitle className="text-base">API Reference</CardTitle>
                    <CardDescription>Full API documentation</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
              <Link href="/blog">
                <Card className="h-full hover:border-primary transition-colors cursor-pointer">
                  <CardHeader>
                    <CardTitle className="text-base">Blog Home</CardTitle>
                    <CardDescription>More articles</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            </div>
          </section>
        </div>
      </article>
    </div>
  );
}
