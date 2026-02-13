import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Code2, FolderSearch, Shield, Terminal, Zap, FileCode } from 'lucide-react';

export default function IntegrateSkillsPage() {
  return (
    <div className="container mx-auto py-8 max-w-4xl">
      {/* Breadcrumb */}
      <div className="mb-6">
        <Link href="/docs" className="text-sm text-muted-foreground hover:text-foreground">
          &larr; Back to Documentation
        </Link>
      </div>

      <h1 className="text-4xl font-bold mb-4">Integrate Skills</h1>
      <p className="text-xl text-muted-foreground mb-8">
        How to add skills support to an AI agent or development tool
      </p>

      {/* Integration Approaches */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Integration Approaches</h2>
        <p className="text-muted-foreground mb-6">
          The two main approaches to integrating skills are:
        </p>
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <Terminal className="h-6 w-6 text-primary mb-2" />
              <CardTitle className="text-lg">Filesystem-based Agents</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                Operate within a computer environment (bash/unix) and represent the most capable
                option. Skills are activated when models issue shell commands like{' '}
                <code className="text-xs">cat /path/to/my-skill/SKILL.md</code>. Bundled resources
                are accessed through shell commands.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Code2 className="h-6 w-6 text-primary mb-2" />
              <CardTitle className="text-lg">Tool-based Agents</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                Function without a dedicated computer environment. Instead, they implement tools
                allowing models to trigger skills and access bundled assets. The specific tool
                implementation is up to the developer.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Overview */}
      <section className="mb-12">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Overview
            </CardTitle>
            <CardDescription>
              A skills-compatible agent needs to perform these steps
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { num: '1', title: 'Discover', desc: 'Skills in configured directories' },
                { num: '2', title: 'Load metadata', desc: 'Name and description at startup' },
                { num: '3', title: 'Match', desc: 'User tasks to relevant skills' },
                { num: '4', title: 'Activate', desc: 'Skills by loading full instructions' },
                { num: '5', title: 'Execute', desc: 'Scripts and access resources as needed' },
              ].map((step) => (
                <div key={step.num} className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0">
                    {step.num}
                  </div>
                  <div>
                    <p className="font-medium">{step.title}</p>
                    <p className="text-sm text-muted-foreground">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Skill Discovery */}
      <section className="mb-12">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderSearch className="h-5 w-5" />
              Skill Discovery
            </CardTitle>
            <CardDescription>
              Skills are folders containing a SKILL.md file
            </CardDescription>
          </CardHeader>
          <CardContent className="prose prose-neutral dark:prose-invert max-w-none">
            <p>
              Your agent should scan configured directories for valid skills. At startup, parse
              only the frontmatter of each <code>SKILL.md</code> file. This keeps initial context
              usage low.
            </p>

            <h3>Parsing Frontmatter</h3>
            <pre className="p-4 bg-muted rounded text-sm overflow-x-auto">
{`function parseMetadata(skillPath):
  content = readFile(skillPath + "/SKILL.md")
  frontmatter = extractYAMLFrontmatter(content)
  return {
    name: frontmatter.name,
    description: frontmatter.description,
    path: skillPath
  }`}
            </pre>

            <h3>Injecting into Context</h3>
            <p>
              Include skill metadata in the system prompt so the model knows what skills are
              available. Follow your platform&apos;s guidance for system prompt updates. For
              Claude models, the recommended format uses XML:
            </p>
            <pre className="p-4 bg-muted rounded text-sm overflow-x-auto">
{`<skill>
  <name>pdf-processing</name>
  <description>Extracts text and tables from PDF files,
    fills forms, merges documents.</description>
  <location>/path/to/skills/pdf-processing/SKILL.md</location>
</skill>

<skill>
  <name>data-analysis</name>
  <description>Analyzes datasets, generates charts,
    and creates summary reports.</description>
  <location>/path/to/skills/data-analysis/SKILL.md</location>
</skill>`}
            </pre>
            <p className="text-sm text-muted-foreground">
              For filesystem-based agents, include the <code>location</code> field with the
              absolute path to the SKILL.md file. For tool-based agents, the location can be
              omitted. Keep metadata concise. Each skill should add roughly 50-100 tokens to
              the context.
            </p>
          </CardContent>
        </Card>
      </section>

      {/* Security Considerations */}
      <section className="mb-12">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security Considerations
            </CardTitle>
            <CardDescription>
              Script execution introduces security risks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="p-4 bg-muted/50 rounded-lg">
                <h4 className="font-medium mb-2">Sandboxing</h4>
                <p className="text-sm text-muted-foreground">
                  Run scripts in isolated environments to prevent unauthorized access
                </p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg">
                <h4 className="font-medium mb-2">Allowlisting</h4>
                <p className="text-sm text-muted-foreground">
                  Only execute scripts from trusted skills
                </p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg">
                <h4 className="font-medium mb-2">Confirmation</h4>
                <p className="text-sm text-muted-foreground">
                  Ask users before running potentially dangerous operations
                </p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg">
                <h4 className="font-medium mb-2">Logging</h4>
                <p className="text-sm text-muted-foreground">
                  Record all script executions for auditing
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Reference Implementation */}
      <section className="mb-12">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileCode className="h-5 w-5" />
              Reference Implementation
            </CardTitle>
            <CardDescription>
              The skills-ref library provides Python utilities and a CLI
            </CardDescription>
          </CardHeader>
          <CardContent className="prose prose-neutral dark:prose-invert max-w-none">
            <p>Use the <code>skills-ref</code> library for working with skills:</p>

            <h4>Validate a skill directory:</h4>
            <pre className="p-4 bg-muted rounded text-sm overflow-x-auto">
{`skills-ref validate <path-to-skill>`}
            </pre>

            <h4>Generate skill XML for agent prompts:</h4>
            <pre className="p-4 bg-muted rounded text-sm overflow-x-auto">
{`skills-ref to-prompt <path-to-skills-dir> ...`}
            </pre>

            <p className="text-sm text-muted-foreground">
              Use the library source code as a reference implementation for building your
              own skills-compatible agent.
            </p>
          </CardContent>
        </Card>
      </section>

      {/* Next Steps */}
      <section className="text-center">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="py-8">
            <h3 className="text-xl font-bold mb-2">Next Steps</h3>
            <p className="text-muted-foreground mb-4">
              Learn more about Agent Skills
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link href="/docs/what-are-skills">
                <Button size="lg" variant="outline">
                  What are Skills
                </Button>
              </Link>
              <Link href="/docs/specification">
                <Button size="lg" variant="outline">
                  View Specification
                </Button>
              </Link>
              <Link href="/marketplace">
                <Button size="lg">
                  Browse Marketplace
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
