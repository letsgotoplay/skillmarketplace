import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Upload,
  Search,
  Download,
  Shield,
  Play,
  Eye,
  Users,
  ArrowRight,
  CheckCircle2,
  FileText,
  FolderTree,
  AlertTriangle,
  Clock,
  GitBranch,
  BarChart3,
} from 'lucide-react';

export default function GettingStartedPage() {
  return (
    <div className="container mx-auto py-8 max-w-4xl">
      {/* Breadcrumb */}
      <div className="mb-6">
        <Link href="/docs" className="text-sm text-muted-foreground hover:text-foreground">
          &larr; Back to Documentation
        </Link>
      </div>

      <h1 className="text-4xl font-bold mb-4">Getting Started</h1>
      <p className="text-xl text-muted-foreground mb-8">
        Learn how to use SkillHub to discover, validate, and deploy AI agent skills
        safely in your organization.
      </p>

      {/* Quick Start */}
      <section className="mb-12">
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle>Quick Start</CardTitle>
            <CardDescription>
              Get up and running in minutes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <Link href="/marketplace" className="flex items-center gap-3 p-3 bg-background rounded-lg hover:bg-muted transition-colors">
                <Search className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">Browse Skills</p>
                  <p className="text-sm text-muted-foreground">Find what you need</p>
                </div>
              </Link>
              <Link href="/dashboard/skills/upload" className="flex items-center gap-3 p-3 bg-background rounded-lg hover:bg-muted transition-colors">
                <Upload className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">Upload a Skill</p>
                  <p className="text-sm text-muted-foreground">Share your skills</p>
                </div>
              </Link>
              <Link href="/docs/api" className="flex items-center gap-3 p-3 bg-background rounded-lg hover:bg-muted transition-colors">
                <FileText className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">API Docs</p>
                  <p className="text-sm text-muted-foreground">Integrate programmatically</p>
                </div>
              </Link>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Core Flows */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Core User Flows</h2>

        {/* Flow 1: Upload */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-primary" />
              Flow 1: Upload & Publish a Skill
            </CardTitle>
            <CardDescription>
              Share your skill with your team or the entire organization
            </CardDescription>
          </CardHeader>
          <CardContent className="prose prose-neutral dark:prose-invert max-w-none">
            {/* Step by step */}
            <div className="space-y-6 not-prose">
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0">1</div>
                <div className="flex-1">
                  <h4 className="font-medium">Prepare Your Skill Package</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Create a ZIP file with your skill following the specification:
                  </p>
                  <pre className="p-3 bg-muted rounded text-xs overflow-x-auto">
{`my-skill.zip
├── SKILL.md          # Required: metadata + instructions
├── scripts/          # Optional: executable code
├── references/       # Optional: additional docs
├── assets/           # Optional: templates, resources
└── tests.json        # Optional: test cases for evaluation`}
                  </pre>
                  <p className="text-xs text-muted-foreground mt-2">
                    <Link href="/docs/specification" className="text-primary hover:underline">
                      View full specification →
                    </Link>
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0">2</div>
                <div className="flex-1">
                  <h4 className="font-medium">Navigate to Upload</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Go to <code className="bg-muted px-1 rounded">/dashboard/skills/upload</code> or
                    click &quot;Upload Skill&quot; from the dashboard.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0">3</div>
                <div className="flex-1">
                  <h4 className="font-medium">Fill in Details</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Select your file and configure:
                  </p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• <strong>Visibility:</strong> Public, Team Only, or Private</li>
                    <li>• <strong>Category:</strong> Development, Security, Data, AI/ML, etc.</li>
                    <li>• <strong>Tags:</strong> Comma-separated keywords for search</li>
                    <li>• <strong>Team:</strong> Optional team assignment</li>
                    <li>• <strong>Changelog:</strong> Notes about this version</li>
                  </ul>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0">4</div>
                <div className="flex-1">
                  <h4 className="font-medium">Automatic Processing</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    After upload, the system automatically:
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <div className="flex items-center gap-2 p-2 bg-muted rounded text-xs">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span>Specification Validation</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-muted rounded text-xs">
                      <Shield className="h-4 w-4 text-blue-500" />
                      <span>Security Scan</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-muted rounded text-xs">
                      <Play className="h-4 w-4 text-orange-500" />
                      <span>Evaluation (if tests)</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0">5</div>
                <div className="flex-1">
                  <h4 className="font-medium">Review Results</h4>
                  <p className="text-sm text-muted-foreground">
                    Check the skill page to see security scores, evaluation results,
                    and any warnings or recommendations.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Flow 2: Discovery */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5 text-primary" />
              Flow 2: Discover & Preview Skills
            </CardTitle>
            <CardDescription>
              Find the right skill for your needs
            </CardDescription>
          </CardHeader>
          <CardContent className="prose prose-neutral dark:prose-invert max-w-none">
            <div className="space-y-6 not-prose">
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0">1</div>
                <div className="flex-1">
                  <h4 className="font-medium">Browse the Marketplace</h4>
                  <p className="text-sm text-muted-foreground">
                    Navigate to <code className="bg-muted px-1 rounded">/marketplace</code> to see
                    all available skills. Use the search bar and category filters to narrow down results.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0">2</div>
                <div className="flex-1">
                  <h4 className="font-medium">Filter by Category</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Available categories include:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {['Development', 'Security', 'Data & Analytics', 'AI/ML', 'Testing', 'Integration'].map(cat => (
                      <span key={cat} className="px-2 py-1 bg-muted rounded text-xs">{cat}</span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0">3</div>
                <div className="flex-1">
                  <h4 className="font-medium">Preview Skill Details</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Click on any skill to see:
                  </p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• <strong>File Browser:</strong> Interactive tree view of all files</li>
                    <li>• <strong>SKILL.md Preview:</strong> Instructions and metadata</li>
                    <li>• <strong>Security Score:</strong> Pattern scan results + AI analysis</li>
                    <li>• <strong>Eval Results:</strong> Test pass/fail rates (if available)</li>
                    <li>• <strong>Version History:</strong> All versions with changelogs</li>
                  </ul>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0">4</div>
                <div className="flex-1">
                  <h4 className="font-medium">Check Security Status</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Look for the security indicators:
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <div className="flex items-center gap-2 p-2 bg-green-500/10 rounded text-xs">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      <span>Low Risk</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-yellow-500/10 rounded text-xs">
                      <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                      <span>Medium Risk</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-orange-500/10 rounded text-xs">
                      <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                      <span>High Risk</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-red-500/10 rounded text-xs">
                      <div className="w-2 h-2 rounded-full bg-red-500"></div>
                      <span>Critical Risk</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Flow 3: Download */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5 text-primary" />
              Flow 3: Download a Skill
            </CardTitle>
            <CardDescription>
              Get the skill files you need for your agent
            </CardDescription>
          </CardHeader>
          <CardContent className="prose prose-neutral dark:prose-invert max-w-none">
            <div className="space-y-6 not-prose">
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0">1</div>
                <div className="flex-1">
                  <h4 className="font-medium">Choose Download Type</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Three download options are available:
                  </p>
                  <div className="grid md:grid-cols-3 gap-2">
                    <div className="p-3 bg-muted rounded">
                      <p className="font-medium text-sm">Full ZIP</p>
                      <p className="text-xs text-muted-foreground">Complete skill package</p>
                    </div>
                    <div className="p-3 bg-muted rounded">
                      <p className="font-medium text-sm">SKILL.md Only</p>
                      <p className="text-xs text-muted-foreground">Just the instructions</p>
                    </div>
                    <div className="p-3 bg-muted rounded">
                      <p className="font-medium text-sm">Scripts Only</p>
                      <p className="text-xs text-muted-foreground">Just the code files</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0">2</div>
                <div className="flex-1">
                  <h4 className="font-medium">Security Warning</h4>
                  <p className="text-sm text-muted-foreground">
                    If the skill has high or critical risk, a warning modal will appear
                    before download. Review the security findings carefully before proceeding.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0">3</div>
                <div className="flex-1">
                  <h4 className="font-medium">Security Headers</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Download responses include security info in headers:
                  </p>
                  <pre className="p-3 bg-muted rounded text-xs overflow-x-auto">
{`X-Security-Score: 85
X-Security-Risk-Level: low
X-Security-Warning: false`}
                  </pre>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Flow 4: API Integration */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Flow 4: API Integration
            </CardTitle>
            <CardDescription>
              Integrate SkillHub into your automation
            </CardDescription>
          </CardHeader>
          <CardContent className="prose prose-neutral dark:prose-invert max-w-none">
            <div className="space-y-4 not-prose">
              <p className="text-sm text-muted-foreground">
                All SkillHub features are available via REST API:
              </p>
              <pre className="p-3 bg-muted rounded text-xs overflow-x-auto">
{`# List skills
GET /api/skills?category=development&search=pdf

# Get skill details
GET /api/skills/{id}

# Download skill
GET /api/skills/{id}/download?type=full

# Check security status
GET /api/skills/{id}/security-status

# Queue evaluation
POST /api/eval
{ "skillVersionId": "..." }`}
              </pre>
              <p className="text-sm text-muted-foreground">
                <Link href="/docs/api" className="text-primary hover:underline">
                  View full API Reference →
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Key Concepts */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Key Concepts</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FolderTree className="h-5 w-5 text-primary" />
                File Browser
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Every skill page includes an interactive file browser. Click any file
                to preview its contents directly in the browser—no download required.
                Perfect for reviewing code before using a skill.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Security Pipeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Two-layer security analysis: pattern-based scanning detects known issues,
                while AI analysis identifies subtle threats. Results are combined into
                an overall risk assessment.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <GitBranch className="h-5 w-5 text-primary" />
                Versioning
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Each upload creates a new version. Download specific versions using
                the <code className="bg-muted px-1 rounded">?version=</code> parameter.
                All versions retain their own security and evaluation data.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Visibility
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Control who can see your skills: Public (everyone), Team Only
                (team members), or Private (just you). Team skills track contributions
                and show activity feeds.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Play className="h-5 w-5 text-primary" />
                Evaluation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Include a <code className="bg-muted px-1 rounded">tests.json</code> file
                to enable automated testing. The system queues evaluations and stores
                results for each test case.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Track skill usage with views, downloads, and feedback stats.
                Team analytics show contribution activity and skill performance over time.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Security Details */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Security Analysis Details</h2>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                  <Eye className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <h4 className="font-medium">Pattern-Based Scanning</h4>
                  <p className="text-sm text-muted-foreground">
                    Checks for known vulnerability patterns: command injection, path traversal,
                    hardcoded secrets, dangerous function calls, and more. Generates a score
                    from 0-100.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0">
                  <Shield className="h-5 w-5 text-purple-500" />
                </div>
                <div>
                  <h4 className="font-medium">AI Security Analysis</h4>
                  <p className="text-sm text-muted-foreground">
                    Deep semantic analysis using AI to detect: obfuscated malware, logic bombs,
                    data exfiltration attempts, hidden backdoors, and other subtle threats that
                    pattern matching might miss.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center shrink-0">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                </div>
                <div>
                  <h4 className="font-medium">Risk Assessment</h4>
                  <p className="text-sm text-muted-foreground">
                    Combines both analyses into overall risk level (low/medium/high/critical).
                    AI-detected threats take precedence if severity is higher than pattern score suggests.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* CTA */}
      <section className="text-center">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="py-8">
            <h3 className="text-xl font-bold mb-2">Ready to Start?</h3>
            <p className="text-muted-foreground mb-4">
              Explore the marketplace or upload your first skill
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link href="/marketplace">
                <Button size="lg">
                  Browse Marketplace
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/dashboard/skills/upload">
                <Button size="lg" variant="outline">
                  Upload a Skill
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
