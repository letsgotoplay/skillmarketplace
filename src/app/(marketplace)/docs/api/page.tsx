import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Package,
  Shield,
  Play,
  BarChart3,
  Users,
  Lock,
  ArrowRight,
  ExternalLink,
  FileJson,
} from 'lucide-react';

export default function ApiReferencePage() {
  return (
    <div className="container mx-auto py-8 max-w-4xl">
      {/* Breadcrumb */}
      <div className="mb-6">
        <Link href="/docs" className="text-sm text-muted-foreground hover:text-foreground">
          &larr; Back to Documentation
        </Link>
      </div>

      <h1 className="text-4xl font-bold mb-4">API Reference</h1>
      <p className="text-xl text-muted-foreground mb-8">
        Complete REST API documentation for SkillHub
      </p>

      {/* Swagger UI Link */}
      <section className="mb-12">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="py-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <FileJson className="h-8 w-8 text-primary" />
                <div>
                  <h3 className="font-semibold">Interactive API Documentation</h3>
                  <p className="text-sm text-muted-foreground">
                    Explore and test APIs with Swagger UI
                  </p>
                </div>
              </div>
              <Link href="/api-docs" target="_blank">
                <Button>
                  Open Swagger UI
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Quick Navigation */}
      <section className="mb-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <a href="#skills" className="p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors">
            <Package className="h-5 w-5 text-primary mb-2" />
            <p className="font-medium text-sm">Skills</p>
          </a>
          <a href="#security" className="p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors">
            <Shield className="h-5 w-5 text-primary mb-2" />
            <p className="font-medium text-sm">Security</p>
          </a>
          <a href="#evaluations" className="p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors">
            <Play className="h-5 w-5 text-primary mb-2" />
            <p className="font-medium text-sm">Evaluations</p>
          </a>
          <a href="#stats" className="p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors">
            <BarChart3 className="h-5 w-5 text-primary mb-2" />
            <p className="font-medium text-sm">Statistics</p>
          </a>
        </div>
      </section>

      {/* Authentication */}
      <section className="mb-12">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Authentication
            </CardTitle>
          </CardHeader>
          <CardContent className="prose prose-neutral dark:prose-invert max-w-none">
            <p>
              All API endpoints use session-based authentication via NextAuth.js.
              Include your session cookie with requests, or use the API from a logged-in browser session.
            </p>
            <p className="text-sm text-muted-foreground">
              Public endpoints (like listing public skills) don&apos;t require authentication.
              Private/Team skills require a valid session.
            </p>
          </CardContent>
        </Card>
      </section>

      {/* Skills API */}
      <section id="skills" className="mb-12">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Package className="h-6 w-6 text-primary" />
          Skills API
        </h2>

        {/* List Skills */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/10">GET</Badge>
              <code className="text-sm font-mono">/api/skills</code>
            </div>
            <CardTitle>List Skills</CardTitle>
            <CardDescription>Get a paginated list of skills with optional filtering</CardDescription>
          </CardHeader>
          <CardContent className="prose prose-neutral dark:prose-invert max-w-none">
            <h4 className="text-sm font-semibold mb-2">Query Parameters</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3">Parameter</th>
                    <th className="text-left py-2 px-3">Type</th>
                    <th className="text-left py-2 px-3">Default</th>
                    <th className="text-left py-2 px-3">Description</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="py-2 px-3"><code>visibility</code></td>
                    <td className="py-2 px-3">string</td>
                    <td className="py-2 px-3">PUBLIC</td>
                    <td className="py-2 px-3">PUBLIC, TEAM_ONLY, or PRIVATE (auth required for non-public)</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 px-3"><code>category</code></td>
                    <td className="py-2 px-3">string</td>
                    <td className="py-2 px-3">-</td>
                    <td className="py-2 px-3">DEVELOPMENT, SECURITY, DATA, AIML, TESTING, INTEGRATION</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 px-3"><code>search</code></td>
                    <td className="py-2 px-3">string</td>
                    <td className="py-2 px-3">-</td>
                    <td className="py-2 px-3">Search in name, description, and tags</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 px-3"><code>limit</code></td>
                    <td className="py-2 px-3">number</td>
                    <td className="py-2 px-3">20</td>
                    <td className="py-2 px-3">Max results per page</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3"><code>offset</code></td>
                    <td className="py-2 px-3">number</td>
                    <td className="py-2 px-3">0</td>
                    <td className="py-2 px-3">Pagination offset</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h4 className="text-sm font-semibold mt-4 mb-2">Response</h4>
            <pre className="p-3 bg-muted rounded text-xs overflow-x-auto">
{`{
  "skills": [
    {
      "id": "uuid",
      "name": "pdf-processing",
      "slug": "pdf-processing",
      "description": "Extract text from PDFs...",
      "category": "DEVELOPMENT",
      "tags": ["pdf", "document"],
      "visibility": "PUBLIC",
      "author": { "id": "uuid", "name": "John Doe" },
      "team": null,
      "stats": { "downloadsCount": 150, "viewsCount": 500 },
      "versions": [{ "version": "1.0.0", "createdAt": "..." }],
      "createdAt": "2025-01-15T..."
    }
  ],
  "total": 42
}`}
            </pre>

            <h4 className="text-sm font-semibold mt-4 mb-2">Example</h4>
            <pre className="p-3 bg-muted rounded text-xs overflow-x-auto">
{`GET /api/skills?category=DEVELOPMENT&search=pdf&limit=10`}
            </pre>
          </CardContent>
        </Card>

        {/* Upload Skill */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <Badge className="bg-blue-500/10 text-blue-600 hover:bg-blue-500/10">POST</Badge>
              <code className="text-sm font-mono">/api/skills</code>
            </div>
            <CardTitle>Upload Skill</CardTitle>
            <CardDescription>Upload a new skill package (ZIP file). Requires authentication with SKILL_WRITE scope.</CardDescription>
          </CardHeader>
          <CardContent className="prose prose-neutral dark:prose-invert max-w-none">
            <h4 className="text-sm font-semibold mb-2">Request</h4>
            <p className="text-sm text-muted-foreground mb-2">
              Content-Type: <code>multipart/form-data</code>
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3">Field</th>
                    <th className="text-left py-2 px-3">Type</th>
                    <th className="text-left py-2 px-3">Required</th>
                    <th className="text-left py-2 px-3">Description</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="py-2 px-3"><code>file</code></td>
                    <td className="py-2 px-3">File</td>
                    <td className="py-2 px-3">Yes</td>
                    <td className="py-2 px-3">ZIP file containing SKILL.md</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 px-3"><code>visibility</code></td>
                    <td className="py-2 px-3">string</td>
                    <td className="py-2 px-3">No</td>
                    <td className="py-2 px-3">PUBLIC, TEAM_ONLY, or PRIVATE (default: PUBLIC)</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 px-3"><code>category</code></td>
                    <td className="py-2 px-3">string</td>
                    <td className="py-2 px-3">No</td>
                    <td className="py-2 px-3">Skill category (auto-detected if not provided)</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 px-3"><code>tags</code></td>
                    <td className="py-2 px-3">string</td>
                    <td className="py-2 px-3">No</td>
                    <td className="py-2 px-3">Comma-separated tags (auto-detected if not provided)</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 px-3"><code>teamId</code></td>
                    <td className="py-2 px-3">string</td>
                    <td className="py-2 px-3">No</td>
                    <td className="py-2 px-3">Team UUID to associate skill with</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3"><code>changelog</code></td>
                    <td className="py-2 px-3">string</td>
                    <td className="py-2 px-3">No</td>
                    <td className="py-2 px-3">Version changelog</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h4 className="text-sm font-semibold mt-4 mb-2">Response (201 Created)</h4>
            <pre className="p-3 bg-muted rounded text-xs overflow-x-auto">
{`{
  "success": true,
  "skillId": "uuid",
  "versionId": "uuid",
  "slug": "pdf-processing",
  "fullSlug": "alice/pdf-processing",
  "specValidationPassed": true
}`}
            </pre>

            <h4 className="text-sm font-semibold mt-4 mb-2">Example (CLI / curl)</h4>
            <pre className="p-3 bg-muted rounded text-xs overflow-x-auto">
{`curl -X POST https://your-domain.com/api/skills \\
  -H "Authorization: Bearer sh_your_token" \\
  -F "file=@my-skill.zip" \\
  -F "visibility=PUBLIC" \\
  -F "category=DEVELOPMENT" \\
  -F "tags=pdf,document,processing"`}
            </pre>

            <h4 className="text-sm font-semibold mt-4 mb-2">Errors</h4>
            <ul className="text-sm">
              <li><code>400</code> - Validation error (invalid ZIP, missing SKILL.md, etc.)</li>
              <li><code>401</code> - Unauthorized (missing or invalid token)</li>
              <li><code>403</code> - Forbidden (missing SKILL_WRITE scope)</li>
            </ul>
          </CardContent>
        </Card>

        {/* Get Skill */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/10">GET</Badge>
              <code className="text-sm font-mono">/api/skills/{'{id}'}</code>
            </div>
            <CardTitle>Get Skill Details</CardTitle>
            <CardDescription>Get detailed information about a specific skill</CardDescription>
          </CardHeader>
          <CardContent className="prose prose-neutral dark:prose-invert max-w-none">
            <h4 className="text-sm font-semibold mb-2">Path Parameters</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3">Parameter</th>
                    <th className="text-left py-2 px-3">Type</th>
                    <th className="text-left py-2 px-3">Description</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="py-2 px-3"><code>id</code></td>
                    <td className="py-2 px-3">string</td>
                    <td className="py-2 px-3">Skill UUID</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h4 className="text-sm font-semibold mt-4 mb-2">Response</h4>
            <pre className="p-3 bg-muted rounded text-xs overflow-x-auto">
{`{
  "id": "uuid",
  "name": "pdf-processing",
  "slug": "pdf-processing",
  "description": "Extract text from PDFs...",
  "category": "DEVELOPMENT",
  "tags": ["pdf", "document"],
  "visibility": "PUBLIC",
  "author": { "id": "uuid", "name": "John Doe", "email": "john@example.com" },
  "team": { "id": "uuid", "name": "Engineering", "slug": "engineering" },
  "stats": { "downloadsCount": 150, "viewsCount": 500, "lastViewedAt": "..." },
  "versions": [
    {
      "id": "uuid",
      "version": "1.0.0",
      "changelog": "Initial release",
      "createdAt": "2025-01-15T..."
    }
  ]
}`}
            </pre>

            <h4 className="text-sm font-semibold mt-4 mb-2">Errors</h4>
            <ul className="text-sm">
              <li><code>401</code> - Unauthorized (for private/team skills)</li>
              <li><code>403</code> - Access denied (not a team member)</li>
              <li><code>404</code> - Skill not found</li>
            </ul>
          </CardContent>
        </Card>

        {/* Delete Skill */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <Badge className="bg-red-500/10 text-red-600 hover:bg-red-500/10">DELETE</Badge>
              <code className="text-sm font-mono">/api/skills/{'{id}'}</code>
            </div>
            <CardTitle>Delete Skill</CardTitle>
            <CardDescription>Delete a skill (owner only)</CardDescription>
          </CardHeader>
          <CardContent className="prose prose-neutral dark:prose-invert max-w-none">
            <h4 className="text-sm font-semibold mb-2">Response</h4>
            <pre className="p-3 bg-muted rounded text-xs overflow-x-auto">
{`{ "success": true }`}
            </pre>
            <h4 className="text-sm font-semibold mt-4 mb-2">Errors</h4>
            <ul className="text-sm">
              <li><code>401</code> - Unauthorized</li>
              <li><code>403</code> - Access denied (not the owner)</li>
              <li><code>404</code> - Skill not found</li>
            </ul>
          </CardContent>
        </Card>

        {/* Download Skill */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/10">GET</Badge>
              <code className="text-sm font-mono">/api/download/{'{id}'}</code>
            </div>
            <CardTitle>Download Skill</CardTitle>
            <CardDescription>Download skill files in various formats</CardDescription>
          </CardHeader>
          <CardContent className="prose prose-neutral dark:prose-invert max-w-none">
            <h4 className="text-sm font-semibold mb-2">Query Parameters</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3">Parameter</th>
                    <th className="text-left py-2 px-3">Type</th>
                    <th className="text-left py-2 px-3">Default</th>
                    <th className="text-left py-2 px-3">Description</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="py-2 px-3"><code>type</code></td>
                    <td className="py-2 px-3">string</td>
                    <td className="py-2 px-3">full</td>
                    <td className="py-2 px-3">full, md, or scripts</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3"><code>version</code></td>
                    <td className="py-2 px-3">string</td>
                    <td className="py-2 px-3">latest</td>
                    <td className="py-2 px-3">Specific version to download</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h4 className="text-sm font-semibold mt-4 mb-2">Download Types</h4>
            <div className="grid md:grid-cols-3 gap-2 not-prose">
              <div className="p-3 bg-muted rounded">
                <p className="font-medium text-sm">full</p>
                <p className="text-xs text-muted-foreground">Complete ZIP package</p>
              </div>
              <div className="p-3 bg-muted rounded">
                <p className="font-medium text-sm">md</p>
                <p className="text-xs text-muted-foreground">SKILL.md file only</p>
              </div>
              <div className="p-3 bg-muted rounded">
                <p className="font-medium text-sm">scripts</p>
                <p className="text-xs text-muted-foreground">All code files as ZIP</p>
              </div>
            </div>

            <h4 className="text-sm font-semibold mt-4 mb-2">Response Headers</h4>
            <pre className="p-3 bg-muted rounded text-xs overflow-x-auto">
{`Content-Type: application/zip (or text/markdown for md type)
Content-Disposition: attachment; filename="skill-name-1.0.0.zip"
X-Security-Score: 85
X-Security-Risk-Level: low
X-Security-Warning: false`}
            </pre>

            <h4 className="text-sm font-semibold mt-4 mb-2">Example</h4>
            <pre className="p-3 bg-muted rounded text-xs overflow-x-auto">
{`GET /api/download/{id or fullSlug}?type=scripts&version=1.2.0`}
            </pre>
          </CardContent>
        </Card>

        {/* Feedback */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/10">GET</Badge>
              <Badge className="bg-blue-500/10 text-blue-600 hover:bg-blue-500/10">POST</Badge>
              <code className="text-sm font-mono">/api/skills/{'{id}'}/feedback</code>
            </div>
            <CardTitle>Skill Feedback</CardTitle>
            <CardDescription>Get or submit feedback for a skill</CardDescription>
          </CardHeader>
          <CardContent className="prose prose-neutral dark:prose-invert max-w-none">
            <h4 className="text-sm font-semibold mb-2">GET - List Feedback</h4>
            <pre className="p-3 bg-muted rounded text-xs overflow-x-auto">
{`GET /api/skills/{id}/feedback

Response:
[
  {
    "id": "uuid",
    "rating": 5,
    "comment": "Great skill, very helpful!",
    "user": { "id": "uuid", "name": "Jane Doe" },
    "createdAt": "2025-01-15T..."
  }
]`}
            </pre>

            <h4 className="text-sm font-semibold mt-4 mb-2">POST - Create Feedback</h4>
            <pre className="p-3 bg-muted rounded text-xs overflow-x-auto">
{`POST /api/skills/{id}/feedback
Content-Type: application/json

{
  "rating": 4,        // Optional: 1-5
  "comment": "..."    // Optional: text feedback
}

Response: { "id": "uuid", "rating": 4, "comment": "...", ... }`}
            </pre>
          </CardContent>
        </Card>
      </section>

      {/* Security API */}
      <section id="security" className="mb-12">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary" />
          Security API
        </h2>

        {/* Security Status */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/10">GET</Badge>
              <code className="text-sm font-mono">/api/skills/{'{id}'}/security-status</code>
            </div>
            <CardTitle>Get Security Status</CardTitle>
            <CardDescription>Get security analysis results for a skill</CardDescription>
          </CardHeader>
          <CardContent className="prose prose-neutral dark:prose-invert max-w-none">
            <h4 className="text-sm font-semibold mb-2">Response</h4>
            <pre className="p-3 bg-muted rounded text-xs overflow-x-auto">
{`{
  "skillId": "uuid",
  "version": "1.0.0",
  "processingComplete": true,
  "specification": {
    "passed": true,
    "errors": null
  },
  "patternScan": {
    "score": 85,
    "status": "COMPLETED",
    "completedAt": "2025-01-15T...",
    "report": { ... }
  },
  "aiAnalysis": {
    "riskLevel": "low",
    "threats": [
      {
        "type": "DATA_EXFILTRATION",
        "description": "Potential data exfiltration in network call",
        "severity": "medium",
        "file": "scripts/api.js",
        "remediation": "Review and validate network endpoints"
      }
    ],
    "recommendations": [
      "Consider adding input validation",
      "Review network communication patterns"
    ],
    "confidence": 0.92,
    "analyzedAt": "2025-01-15T..."
  },
  "warning": {
    "shouldWarn": false,
    "reasons": []
  }
}`}
            </pre>
          </CardContent>
        </Card>

        {/* Security Scan */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <Badge className="bg-blue-500/10 text-blue-600 hover:bg-blue-500/10">POST</Badge>
              <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/10">GET</Badge>
              <code className="text-sm font-mono">/api/security/scan</code>
            </div>
            <CardTitle>Run Security Scan</CardTitle>
            <CardDescription>Trigger or retrieve a security scan (owner only)</CardDescription>
          </CardHeader>
          <CardContent className="prose prose-neutral dark:prose-invert max-w-none">
            <h4 className="text-sm font-semibold mb-2">POST - Trigger Scan</h4>
            <pre className="p-3 bg-muted rounded text-xs overflow-x-auto">
{`POST /api/security/scan
Content-Type: application/json

{
  "skillVersionId": "uuid"
}

Response:
{
  "success": true,
  "report": {
    "score": 85,
    "findings": [...],
    "summary": "..."
  }
}`}
            </pre>

            <h4 className="text-sm font-semibold mt-4 mb-2">GET - Get Scan Results</h4>
            <pre className="p-3 bg-muted rounded text-xs overflow-x-auto">
{`GET /api/security/scan?skillVersionId={uuid}

Response: { "id": "uuid", "score": 85, ... }`}
            </pre>
          </CardContent>
        </Card>
      </section>

      {/* Evaluations API */}
      <section id="evaluations" className="mb-12">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Play className="h-6 w-6 text-primary" />
          Evaluations API
        </h2>

        {/* Queue Evaluation */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <Badge className="bg-blue-500/10 text-blue-600 hover:bg-blue-500/10">POST</Badge>
              <code className="text-sm font-mono">/api/eval</code>
            </div>
            <CardTitle>Queue Evaluation</CardTitle>
            <CardDescription>Queue a skill for evaluation (owner only)</CardDescription>
          </CardHeader>
          <CardContent className="prose prose-neutral dark:prose-invert max-w-none">
            <h4 className="text-sm font-semibold mb-2">Request</h4>
            <pre className="p-3 bg-muted rounded text-xs overflow-x-auto">
{`POST /api/eval
Content-Type: application/json

{
  "skillVersionId": "uuid"
}

Response:
{
  "success": true,
  "evalId": "job-uuid",
  "message": "Evaluation queued successfully"
}`}
            </pre>
            <h4 className="text-sm font-semibold mt-4 mb-2">Errors</h4>
            <ul className="text-sm">
              <li><code>400</code> - No test cases found in skill package</li>
              <li><code>401</code> - Unauthorized</li>
              <li><code>403</code> - Access denied</li>
              <li><code>404</code> - Skill version not found</li>
            </ul>
          </CardContent>
        </Card>

        {/* Get Evaluation Results */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/10">GET</Badge>
              <code className="text-sm font-mono">/api/eval/{'{id}'}</code>
            </div>
            <CardTitle>Get Evaluation Results</CardTitle>
            <CardDescription>Get results of a queued evaluation</CardDescription>
          </CardHeader>
          <CardContent className="prose prose-neutral dark:prose-invert max-w-none">
            <h4 className="text-sm font-semibold mb-2">Response</h4>
            <pre className="p-3 bg-muted rounded text-xs overflow-x-auto">
{`{
  "id": "job-uuid",
  "status": "COMPLETED",
  "skillVersionId": "uuid",
  "results": [
    {
      "testCase": "extract-text",
      "passed": true,
      "output": "Extracted text...",
      "executionTime": 150
    },
    {
      "testCase": "fill-form",
      "passed": false,
      "error": "Timeout exceeded",
      "executionTime": 30000
    }
  ],
  "summary": {
    "total": 2,
    "passed": 1,
    "failed": 1,
    "passRate": 0.5
  },
  "createdAt": "2025-01-15T...",
  "completedAt": "2025-01-15T..."
}`}
            </pre>
          </CardContent>
        </Card>
      </section>

      {/* Statistics API */}
      <section id="stats" className="mb-12">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-primary" />
          Statistics API
        </h2>

        {/* Overview Stats */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/10">GET</Badge>
              <code className="text-sm font-mono">/api/stats/overview</code>
            </div>
            <CardTitle>Overview Statistics</CardTitle>
            <CardDescription>Get overall marketplace statistics</CardDescription>
          </CardHeader>
          <CardContent className="prose prose-neutral dark:prose-invert max-w-none">
            <h4 className="text-sm font-semibold mb-2">Query Parameters</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3">Parameter</th>
                    <th className="text-left py-2 px-3">Type</th>
                    <th className="text-left py-2 px-3">Description</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="py-2 px-3"><code>format</code></td>
                    <td className="py-2 px-3">string</td>
                    <td className="py-2 px-3">Set to &quot;csv&quot; for CSV export</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h4 className="text-sm font-semibold mt-4 mb-2">Response</h4>
            <pre className="p-3 bg-muted rounded text-xs overflow-x-auto">
{`{
  "totalSkills": 150,
  "totalDownloads": 5000,
  "totalViews": 25000,
  "skillsByCategory": {
    "DEVELOPMENT": 45,
    "SECURITY": 30,
    "DATA": 25,
    ...
  },
  "recentUploads": 12,
  "avgSecurityScore": 82
}`}
            </pre>
          </CardContent>
        </Card>

        {/* Skills Stats */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/10">GET</Badge>
              <code className="text-sm font-mono">/api/stats/skills</code>
            </div>
            <CardTitle>Skill Metrics</CardTitle>
            <CardDescription>Get detailed metrics for skills</CardDescription>
          </CardHeader>
          <CardContent className="prose prose-neutral dark:prose-invert max-w-none">
            <pre className="p-3 bg-muted rounded text-xs overflow-x-auto">
{`{
  "skills": [
    {
      "id": "uuid",
      "name": "pdf-processing",
      "downloads": 500,
      "views": 2000,
      "avgRating": 4.5,
      "securityScore": 90
    }
  ]
}`}
            </pre>
          </CardContent>
        </Card>

        {/* Public Stats */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/10">GET</Badge>
              <code className="text-sm font-mono">/api/public/stats</code>
            </div>
            <CardTitle>Public Statistics</CardTitle>
            <CardDescription>Get public marketplace stats (no auth required)</CardDescription>
          </CardHeader>
          <CardContent className="prose prose-neutral dark:prose-invert max-w-none">
            <pre className="p-3 bg-muted rounded text-xs overflow-x-auto">
{`{
  "totalPublicSkills": 100,
  "categories": ["DEVELOPMENT", "SECURITY", "DATA", "AIML", "TESTING", "INTEGRATION"],
  "featuredSkills": [...]
}`}
            </pre>
          </CardContent>
        </Card>
      </section>

      {/* Teams API */}
      <section id="teams" className="mb-12">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Users className="h-6 w-6 text-primary" />
          Teams API
        </h2>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/10">GET</Badge>
              <code className="text-sm font-mono">/api/teams/{'{id}'}/activity</code>
            </div>
            <CardTitle>Team Activity</CardTitle>
            <CardDescription>Get activity feed for a team (team members only)</CardDescription>
          </CardHeader>
          <CardContent className="prose prose-neutral dark:prose-invert max-w-none">
            <h4 className="text-sm font-semibold mb-2">Response</h4>
            <pre className="p-3 bg-muted rounded text-xs overflow-x-auto">
{`{
  "activities": [
    {
      "id": "uuid",
      "type": "SKILL_UPLOADED",
      "userId": "uuid",
      "user": { "name": "John Doe" },
      "resourceId": "skill-uuid",
      "metadata": { "skillName": "pdf-processing" },
      "createdAt": "2025-01-15T..."
    }
  ],
  "total": 50
}`}
            </pre>
          </CardContent>
        </Card>
      </section>

      {/* Error Codes */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Error Codes</h2>
        <Card>
          <CardContent className="pt-6">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3">Code</th>
                    <th className="text-left py-2 px-3">Description</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="py-2 px-3"><code>400</code></td>
                    <td className="py-2 px-3">Bad Request - Invalid parameters or missing required fields</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 px-3"><code>401</code></td>
                    <td className="py-2 px-3">Unauthorized - Authentication required</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 px-3"><code>403</code></td>
                    <td className="py-2 px-3">Forbidden - Access denied (not owner/team member)</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 px-3"><code>404</code></td>
                    <td className="py-2 px-3">Not Found - Resource doesn&apos;t exist</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3"><code>500</code></td>
                    <td className="py-2 px-3">Internal Server Error - Something went wrong</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* CTA */}
      <section className="text-center">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="py-8">
            <h3 className="text-xl font-bold mb-2">Need More Help?</h3>
            <p className="text-muted-foreground mb-4">
              Check out the other documentation resources
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link href="/docs/getting-started">
                <Button variant="outline" className="bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 border-blue-200">
                  Getting Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/docs/specification">
                <Button variant="outline" className="bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 border-blue-200">
                  Specification
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
