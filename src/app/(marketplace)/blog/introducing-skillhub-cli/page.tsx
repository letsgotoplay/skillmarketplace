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
  Download,
  Search,
  RefreshCw,
  Upload,
  Building2,
  ArrowRight,
  CheckCircle2,
  Zap,
  Layers,
  Code2,
} from 'lucide-react';

export default function IntroducingSkillHubCLIPage() {
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
            <Badge variant="secondary">Announcement</Badge>
            <Badge variant="outline">CLI</Badge>
            <span className="text-sm text-muted-foreground">February 2026</span>
          </div>
          <h1 className="text-4xl font-bold mb-4">
            Introducing SkillHub CLI: Manage Skills from Your Terminal
          </h1>
          <p className="text-xl text-muted-foreground">
            A powerful command-line tool to search, install, and manage AI agent skills
            across Claude Code, Cursor, GitHub Copilot, and more.
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
              We&apos;re excited to announce <strong>@letsgotoplay/skillhub-cli</strong> — a command-line tool
              that makes it incredibly easy to discover and install skills from your SkillHub
              marketplace directly into your favorite AI coding tools. Whether you use Claude Code,
              Cursor, GitHub Copilot, or any of the 11 supported platforms, managing skills is now
              just a command away.
            </p>
          </section>

          {/* Quick Start */}
          <section className="mb-12">
            <h2 className="flex items-center gap-2">
              <Zap className="h-6 w-6 text-primary" />
              Quick Start
            </h2>
            <p>Get started in just a few commands:</p>
            <Card className="bg-zinc-950 border-zinc-800">
              <CardContent className="p-4">
                <pre className="text-sm text-zinc-100 overflow-x-auto">
                  <code>{`# Install globally
npm install -g @letsgotoplay/skillhub-cli

# Authenticate with your marketplace
skillhub login

# Search and install skills
skillhub search "pdf"
skillhub add pdf-processor -a claude-code,cursor`}</code>
                </pre>
              </CardContent>
            </Card>
          </section>

          {/* Key Features */}
          <section className="mb-12">
            <h2 className="flex items-center gap-2">
              <CheckCircle2 className="h-6 w-6 text-primary" />
              Key Features
            </h2>
          </section>

          <section className="mb-12 space-y-6">
            {/* Authentication */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Terminal className="h-5 w-5 text-primary" />
                  Secure Authentication
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Authenticate once with your API token and the CLI securely stores your credentials.
                  Generate tokens from your SkillHub dashboard at any time.
                </p>
                <Card className="bg-zinc-950 border-zinc-800">
                  <CardContent className="p-3">
                    <pre className="text-sm text-zinc-100">
                      <code>{`skillhub login sh_your_token_here
skillhub whoami  # Verify your identity`}</code>
                    </pre>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>

            {/* Search */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Search className="h-5 w-5 text-primary" />
                  Powerful Search
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Find the perfect skill with flexible search options. Filter by category,
                  limit results, or output as JSON for scripting.
                </p>
                <Card className="bg-zinc-950 border-zinc-800">
                  <CardContent className="p-3">
                    <pre className="text-sm text-zinc-100">
                      <code>{`skillhub search "api" --limit 10
skillhub search "database" --category DEVELOPMENT
skillhub search "pdf" --json | jq '.skills[].name'`}</code>
                    </pre>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>

            {/* Multi-platform Install */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Layers className="h-5 w-5 text-primary" />
                  Multi-Platform Installation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Install a skill to multiple AI coding tools with a single command.
                  The CLI automatically handles the correct file format and location for each tool.
                </p>
                <Card className="bg-zinc-950 border-zinc-800">
                  <CardContent className="p-3">
                    <pre className="text-sm text-zinc-100">
                      <code>{`# Install to multiple tools at once
skillhub add my-skill -a claude-code,cursor,copilot

# Install to all available tools
skillhub add my-skill --all

# Install specific version
skillhub add my-skill --version 1.2.0`}</code>
                    </pre>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>

            {/* Updates */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <RefreshCw className="h-5 w-5 text-primary" />
                  Easy Updates
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Check for updates and keep all your skills current with simple commands.
                </p>
                <Card className="bg-zinc-950 border-zinc-800">
                  <CardContent className="p-3">
                    <pre className="text-sm text-zinc-100">
                      <code>{`skillhub check          # Check for available updates
skillhub update        # Update all skills
skillhub update my-skill  # Update specific skill`}</code>
                    </pre>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>

            {/* Upload */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Upload className="h-5 w-5 text-primary" />
                  Upload from CLI
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Developers can upload skill packages directly from the command line,
                  perfect for CI/CD pipelines.
                </p>
                <Card className="bg-zinc-950 border-zinc-800">
                  <CardContent className="p-3">
                    <pre className="text-sm text-zinc-100">
                      <code>{`skillhub upload ./my-skill.zip --name "My Skill" --version "1.0.0"`}</code>
                    </pre>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </section>

          {/* Supported Tools */}
          <section className="mb-12">
            <h2 className="flex items-center gap-2">
              <Code2 className="h-6 w-6 text-primary" />
              Supported AI Coding Tools
            </h2>
            <p>
              The CLI supports 11 popular AI coding tools, automatically placing skills
              in the correct format and location:
            </p>
            <div className="grid md:grid-cols-2 gap-3 not-prose mt-4">
              {[
                { name: 'Claude Code', id: 'claude-code', path: '.claude/CLAUDE.md' },
                { name: 'Cursor', id: 'cursor', path: '.cursor/rules' },
                { name: 'GitHub Copilot', id: 'copilot', path: '.github/copilot-instructions.md' },
                { name: 'Windsurf', id: 'windsurf', path: '.windsurf/rules' },
                { name: 'Cline', id: 'cline', path: '.cline/rules' },
                { name: 'Codex', id: 'codex', path: 'CODEX.md' },
                { name: 'OpenCode', id: 'opencode', path: '.opencode/instructions.md' },
                { name: 'Goose', id: 'goose', path: '.goose/hints' },
                { name: 'Kilo', id: 'kilo', path: '.kilo/config.yaml' },
                { name: 'Roo', id: 'roo', path: '.roo/rules' },
                { name: 'Trae', id: 'trae', path: '.trae/instructions.md' },
              ].map((tool) => (
                <Card key={tool.id} className="p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{tool.name}</p>
                      <p className="text-xs text-muted-foreground">{tool.path}</p>
                    </div>
                    <Badge variant="outline" className="text-xs">{tool.id}</Badge>
                  </div>
                </Card>
              ))}
            </div>
          </section>

          {/* Environment Variables */}
          <section className="mb-12">
            <h2>Setting Environment Variables</h2>
            <p>
              Configure the CLI to connect to your SkillHub instance by setting the API URL:
            </p>
            <Card className="bg-zinc-950 border-zinc-800 mt-4">
              <CardContent className="p-4">
                <pre className="text-sm text-zinc-100 overflow-x-auto">
                  <code>{`# Set for a single command
SKILLHUB_API_URL=https://your-api-url.com skillhub search <skill-name>

# Set for current terminal session
export SKILLHUB_API_URL=https://your-api-url.com

# Set permanently (add to ~/.zshrc or ~/.bashrc)
export SKILLHUB_API_URL=https://your-api-url.com`}</code>
                </pre>
              </CardContent>
            </Card>
            <p className="text-sm text-muted-foreground mt-3">
              You can also set <code className="bg-muted px-1 rounded">SKILLHUB_TOKEN</code> environment variable
              for authentication instead of using <code className="bg-muted px-1 rounded">skillhub login</code>.
            </p>
          </section>

          {/* Interactive Mode */}
          <section className="mb-12">
            <h2>Interactive Search & Install</h2>
            <p>
              Not sure what you&apos;re looking for? Use the interactive mode to browse
              and select skills:
            </p>
            <Card className="bg-zinc-950 border-zinc-800 mt-4">
              <CardContent className="p-4">
                <pre className="text-sm text-zinc-100">
                  <code>{`$ skillhub find

? Search for skills: api

? Select a skill to install: (Use arrow keys)
❯ api-gateway-manager - Manage API gateways and routes
  api-rate-limiter - Implement rate limiting for APIs
  api-documentation - Generate OpenAPI documentation
  api-mocking - Create mock API servers

? Select target AI tools: (Press space to select)
◉ claude-code
❯◉ cursor
 ○ copilot`}</code>
                </pre>
              </CardContent>
            </Card>
          </section>

          {/* Use Cases */}
          <section className="mb-12">
            <h2>Common Use Cases</h2>
            <div className="grid md:grid-cols-2 gap-4 not-prose">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Developer Workflow</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  <p>Quickly set up your development environment with essential skills:</p>
                  <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-x-auto">
                    <code>{`skillhub add git-workflow -a claude-code
skillhub add testing-helper -a claude-code
skillhub add code-review -a claude-code`}</code>
                  </pre>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Team Standardization</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  <p>Ensure consistent skills across your team by sharing a setup script:</p>
                  <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-x-auto">
                    <code>{`#!/bin/bash
skillhub add company-linter --all
skillhub add internal-docs --all
skillhub add deploy-helper --all`}</code>
                  </pre>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">CI/CD Integration</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  <p>Automate skill uploads in your deployment pipeline:</p>
                  <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-x-auto">
                    <code>{`# In your CI pipeline
- name: Upload skill
  run: |
    skillhub login $SKILLHUB_TOKEN
    skillhub upload ./dist/skill.zip`}</code>
                  </pre>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Skill Management</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  <p>Keep your skills up to date with regular checks:</p>
                  <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-x-auto">
                    <code>{`# Check for updates weekly
skillhub check
skillhub update`}</code>
                  </pre>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* CTA */}
          <section className="mb-12">
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="py-8">
                <h3 className="text-xl font-bold mb-2">Get Started Today</h3>
                <p className="text-muted-foreground mb-4">
                  Install the SkillHub CLI and start managing your AI agent skills from the terminal.
                </p>
                <div className="flex gap-4 flex-wrap">
                  <Card className="bg-zinc-950 border-zinc-800 flex-1 min-w-[200px]">
                    <CardContent className="p-4">
                      <p className="text-xs text-zinc-400 mb-2">Install with npm</p>
                      <code className="text-sm text-zinc-100">npm install -g @letsgotoplay/skillhub-cli</code>
                    </CardContent>
                  </Card>
                  <Card className="bg-zinc-950 border-zinc-800 flex-1 min-w-[200px]">
                    <CardContent className="p-4">
                      <p className="text-xs text-zinc-400 mb-2">Install with pnpm</p>
                      <code className="text-sm text-zinc-100">pnpm add -g @letsgotoplay/skillhub-cli</code>
                    </CardContent>
                  </Card>
                </div>
                <div className="flex gap-4 mt-6">
                  <Link href="/docs/api">
                    <Button size="lg">
                      View Full Documentation
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/dashboard/settings/tokens">
                    <Button size="lg" variant="outline">
                      Get API Token
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Related Articles */}
          <section>
            <h3 className="text-lg font-semibold mb-4">Related Resources</h3>
            <div className="grid md:grid-cols-4 gap-4 not-prose">
              <Link href="/blog/why-enterprise-skill-hub">
                <Card className="h-full hover:border-primary transition-colors cursor-pointer">
                  <CardHeader>
                    <CardTitle className="text-base">Why Enterprise Skill Hub</CardTitle>
                    <CardDescription>Security-first design</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
              <Link href="/blog/developer-guide">
                <Card className="h-full hover:border-primary transition-colors cursor-pointer">
                  <CardHeader>
                    <CardTitle className="text-base">Developer Guide</CardTitle>
                    <CardDescription>Local setup & operations</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
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
            </div>
          </section>
        </div>
      </article>
    </div>
  );
}
