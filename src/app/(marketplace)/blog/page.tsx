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
  Shield,
  Users,
  Zap,
  Lock,
  GitBranch,
  ArrowRight,
  Building2,
  AlertTriangle,
  CheckCircle2,
  BarChart3,
  Layers,
} from 'lucide-react';

export default function BlogPage() {
  return (
    <div className="container mx-auto py-8 max-w-4xl">
      {/* Breadcrumb */}
      <div className="mb-6">
        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
          &larr; Back to Home
        </Link>
      </div>

      {/* Article Header */}
      <article>
        <header className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Badge variant="secondary">Engineering</Badge>
            <Badge variant="outline">Enterprise</Badge>
            <span className="text-sm text-muted-foreground">February 2025</span>
          </div>
          <h1 className="text-4xl font-bold mb-4">
            Why Build an Enterprise Internal Skill Hub?
          </h1>
          <p className="text-xl text-muted-foreground">
            A deep dive into why enterprises need their own AI agent skill repositories,
            and how security-first design enables safe adoption of agentic AI at scale.
          </p>
        </header>

        {/* Author Info */}
        <div className="flex items-center gap-4 mb-8 pb-8 border-b">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Building2 className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="font-medium">SkillHub Team</p>
            <p className="text-sm text-muted-foreground">Building the future of enterprise AI</p>
          </div>
        </div>

        {/* Article Content */}
        <div className="prose prose-neutral dark:prose-invert max-w-none">
          {/* Introduction */}
          <section className="mb-12">
            <p className="text-lg leading-relaxed">
              As AI agents become increasingly capable, enterprises face a critical challenge:
              <strong> how do you safely deploy agent capabilities across your organization?</strong>
              The answer lies in building a dedicated skill hub—a centralized, secure, and
              auditable marketplace for AI agent skills.
            </p>
          </section>

          {/* The Problem */}
          <section className="mb-12">
            <Card className="border-destructive/50 bg-destructive/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-5 w-5" />
                  The Problem with Public Skill Sources
                </CardTitle>
              </CardHeader>
              <CardContent className="prose prose-neutral dark:prose-invert max-w-none">
                <p>
                  While public skill marketplaces like claude.com/skills or skillsmp.com offer
                  hundreds of thousands of skills, they present significant challenges for enterprise adoption:
                </p>
                <ul>
                  <li>
                    <strong>Security Blind Spots:</strong> Public skills may contain malicious code,
                    hidden backdoors, or data exfiltration attempts that traditional scanning misses.
                  </li>
                  <li>
                    <strong>Compliance Gaps:</strong> No audit trail of what skills were used,
                    when, and by whom—critical for regulated industries.
                  </li>
                  <li>
                    <strong>No Quality Control:</strong> Skills vary wildly in quality, with no
                    standardized testing or validation.
                  </li>
                  <li>
                    <strong>Knowledge Leakage:</strong> Using external skills may expose internal
                    processes or data to third parties.
                  </li>
                </ul>
              </CardContent>
            </Card>
          </section>

          {/* The Solution */}
          <section className="mb-12">
            <h2 className="flex items-center gap-2">
              <CheckCircle2 className="h-6 w-6 text-primary" />
              The Enterprise Skill Hub Solution
            </h2>
            <p className="text-lg">
              An internal skill hub addresses these concerns while enabling your teams to leverage
              AI agents safely and effectively. Here&apos;s why it matters:
            </p>
          </section>

          {/* Key Benefits */}
          <section className="mb-12 space-y-8">
            {/* Security */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  1. Security-First Architecture
                </CardTitle>
                <CardDescription>
                  Every skill is analyzed before it reaches your agents
                </CardDescription>
              </CardHeader>
              <CardContent className="prose prose-neutral dark:prose-invert max-w-none">
                <div className="grid md:grid-cols-2 gap-4 not-prose">
                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-medium mb-2">Pattern-Based Scanning</h4>
                    <p className="text-sm text-muted-foreground">
                      Automatically detect known vulnerabilities, suspicious patterns,
                      and potentially dangerous code constructs.
                    </p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-medium mb-2">AI-Powered Analysis</h4>
                    <p className="text-sm text-muted-foreground">
                      Deep semantic analysis to identify subtle threats that pattern
                      matching might miss—hidden backdoors, obfuscated malware, logic bombs.
                    </p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-medium mb-2">Risk Scoring</h4>
                    <p className="text-sm text-muted-foreground">
                      Clear risk levels (low/medium/high/critical) help teams make
                      informed decisions about which skills to deploy.
                    </p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-medium mb-2">Download Warnings</h4>
                    <p className="text-sm text-muted-foreground">
                      Real-time security headers alert users before downloading
                      potentially dangerous skills.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Validation */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  2. Specification Validation
                </CardTitle>
                <CardDescription>
                  Ensure every skill meets your organizational standards
                </CardDescription>
              </CardHeader>
              <CardContent className="prose prose-neutral dark:prose-invert max-w-none">
                <p>
                  Before a skill is accepted into your hub, it undergoes rigorous validation:
                </p>
                <ul>
                  <li>
                    <strong>SKILL.md Validation:</strong> Required metadata, proper formatting,
                    valid YAML frontmatter.
                  </li>
                  <li>
                    <strong>Structure Check:</strong> Valid directory structure, allowed file types,
                    size limits.
                  </li>
                  <li>
                    <strong>Name Conventions:</strong> Enforce naming standards for consistency
                    and discoverability.
                  </li>
                  <li>
                    <strong>Custom Rules:</strong> Add organization-specific requirements
                    (e.g., required license field, internal metadata).
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Testing */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layers className="h-5 w-5 text-primary" />
                  3. Automated Evaluation
                </CardTitle>
                <CardDescription>
                  Test skills before deployment with built-in test execution
                </CardDescription>
              </CardHeader>
              <CardContent className="prose prose-neutral dark:prose-invert max-w-none">
                <p>
                  When a skill includes test cases, the hub automatically:
                </p>
                <ul>
                  <li>Parses test configurations from the skill package</li>
                  <li>Queues evaluation jobs for asynchronous execution</li>
                  <li>Tracks pass/fail rates and execution metrics</li>
                  <li>Surfaces results alongside the skill for informed decisions</li>
                </ul>
                <p className="text-sm text-muted-foreground">
                  This ensures skills work as expected before your teams rely on them.
                </p>
              </CardContent>
            </Card>

            {/* Audit */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  4. Complete Audit Trail
                </CardTitle>
                <CardDescription>
                  Know exactly what happened, when, and by whom
                </CardDescription>
              </CardHeader>
              <CardContent className="prose prose-neutral dark:prose-invert max-w-none">
                <p>Every action is logged for compliance and accountability:</p>
                <ul>
                  <li><strong>Upload events:</strong> Who uploaded what, when, with what validation results</li>
                  <li><strong>Download events:</strong> Who downloaded which skills and versions</li>
                  <li><strong>Security scans:</strong> Full history of security analysis results</li>
                  <li><strong>Evaluation runs:</strong> Test execution history and outcomes</li>
                </ul>
              </CardContent>
            </Card>

            {/* Teams */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  5. Team Collaboration
                </CardTitle>
                <CardDescription>
                  Enable cross-team sharing with proper access controls
                </CardDescription>
              </CardHeader>
              <CardContent className="prose prose-neutral dark:prose-invert max-w-none">
                <div className="grid md:grid-cols-3 gap-4 not-prose mb-4">
                  <div className="p-4 bg-muted rounded-lg text-center">
                    <Lock className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <h4 className="font-medium">Private</h4>
                    <p className="text-sm text-muted-foreground">Only you can access</p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg text-center">
                    <Users className="h-8 w-8 mx-auto mb-2 text-primary" />
                    <h4 className="font-medium">Team Only</h4>
                    <p className="text-sm text-muted-foreground">Team members can access</p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg text-center">
                    <Zap className="h-8 w-8 mx-auto mb-2 text-green-500" />
                    <h4 className="font-medium">Public</h4>
                    <p className="text-sm text-muted-foreground">Everyone in org can access</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Track team contributions, manage memberships, and see activity feeds
                  for collaborative skill development.
                </p>
              </CardContent>
            </Card>

            {/* Versioning */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GitBranch className="h-5 w-5 text-primary" />
                  6. Version Control
                </CardTitle>
                <CardDescription>
                  Track skill evolution with proper versioning
                </CardDescription>
              </CardHeader>
              <CardContent className="prose prose-neutral dark:prose-invert max-w-none">
                <p>
                  Every skill upload creates a new version, complete with:
                </p>
                <ul>
                  <li>Changelog documentation</li>
                  <li>Independent security analysis per version</li>
                  <li>Separate evaluation results</li>
                  <li>Download tracking per version</li>
                </ul>
              </CardContent>
            </Card>
          </section>

          {/* Use Cases */}
          <section className="mb-12">
            <h2>Real-World Use Cases</h2>
            <div className="grid md:grid-cols-2 gap-4 not-prose">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Security Teams</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Deploy penetration testing, vulnerability scanning, and incident response
                    skills with confidence that they&apos;re vetted and safe.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Development Teams</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Share code review, CI/CD, and debugging skills across the organization
                    while maintaining quality standards.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Data Teams</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Distribute data analysis, ETL, and reporting skills with proper
                    access controls and usage tracking.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Operations Teams</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Standardize deployment, monitoring, and maintenance procedures
                    through validated, version-controlled skills.
                  </p>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* CTA */}
          <section className="mb-12">
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="py-8">
                <h3 className="text-xl font-bold mb-2">Ready to Build Your Skill Hub?</h3>
                <p className="text-muted-foreground mb-4">
                  Get started with SkillHub and bring secure, auditable AI agent capabilities
                  to your enterprise.
                </p>
                <div className="flex gap-4 flex-wrap">
                  <Link href="/docs/getting-started">
                    <Button size="lg">
                      Getting Started Guide
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/marketplace">
                    <Button size="lg" variant="outline">
                      Browse Marketplace
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
              <Link href="/docs/getting-started">
                <Card className="h-full hover:border-primary transition-colors cursor-pointer">
                  <CardHeader>
                    <CardTitle className="text-base">Getting Started</CardTitle>
                    <CardDescription>User guide and flows</CardDescription>
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
            </div>
          </section>
        </div>
      </article>
    </div>
  );
}
