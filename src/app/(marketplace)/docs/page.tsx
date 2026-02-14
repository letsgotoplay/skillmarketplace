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
  Package,
  Book,
  Code,
  ArrowRight,
  Folder,
  Zap,
  Users,
  Shield,
  Rocket,
  FileJson,
} from 'lucide-react';

export default function DocsPage() {
  return (
    <div className="container mx-auto py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-bold mb-4">Agent Skills Documentation</h1>
        <p className="text-xl text-muted-foreground">
          Folders of instructions, scripts, and resources that agents can discover and use
        </p>
      </div>

      {/* What are Agent Skills */}
      <section className="mb-12">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              What are Agent Skills?
            </CardTitle>
          </CardHeader>
          <CardContent className="prose prose-neutral dark:prose-invert max-w-none">
            <p>
              Agent Skills are folders of instructions, scripts, and resources that agents can
              discover and use to do things more accurately and efficiently.
            </p>
            <p>
              Agents are increasingly capable, but often don&apos;t have the context they need to
              do real work reliably. Skills solve this by giving agents access to procedural
              knowledge and company-, team-, and user-specific context they can load on demand.
            </p>
            <h3>What can Agent Skills enable?</h3>
            <ul>
              <li><strong>Domain expertise</strong>: Package specialized knowledge into reusable instructions</li>
              <li><strong>New capabilities</strong>: Give agents new capabilities (creating presentations, building MCP servers, analyzing datasets)</li>
              <li><strong>Repeatable workflows</strong>: Turn multi-step tasks into consistent and auditable workflows</li>
              <li><strong>Interoperability</strong>: Reuse the same skill across different skills-compatible agent products</li>
            </ul>
          </CardContent>
        </Card>
      </section>

      {/* Quick Links */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Documentation</h2>
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
          <Link href="/docs/getting-started">
            <Card className="h-full hover:border-primary transition-colors cursor-pointer">
              <CardHeader>
                <Rocket className="h-8 w-8 text-primary mb-2" />
                <CardTitle className="text-lg">Getting Started</CardTitle>
                <CardDescription>
                  User guide and core flows
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/docs/what-are-skills">
            <Card className="h-full hover:border-primary transition-colors cursor-pointer">
              <CardHeader>
                <Book className="h-8 w-8 text-primary mb-2" />
                <CardTitle className="text-lg">What are Skills</CardTitle>
                <CardDescription>
                  Learn the basics of how skills work
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/docs/specification">
            <Card className="h-full hover:border-primary transition-colors cursor-pointer">
              <CardHeader>
                <Code className="h-8 w-8 text-primary mb-2" />
                <CardTitle className="text-lg">Specification</CardTitle>
                <CardDescription>
                  The complete format specification
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/docs/api">
            <Card className="h-full hover:border-primary transition-colors cursor-pointer">
              <CardHeader>
                <FileJson className="h-8 w-8 text-primary mb-2" />
                <CardTitle className="text-lg">API Reference</CardTitle>
                <CardDescription>
                  Full REST API documentation
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/docs/integrate-skills">
            <Card className="h-full hover:border-primary transition-colors cursor-pointer">
              <CardHeader>
                <Zap className="h-8 w-8 text-primary mb-2" />
                <CardTitle className="text-lg">Integrate Skills</CardTitle>
                <CardDescription>
                  Add skills support to your agent
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </div>
      </section>

      {/* Skill Structure */}
      <section className="mb-12">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Folder className="h-5 w-5" />
              Skill Structure
            </CardTitle>
            <CardDescription>
              A skill is a folder containing at minimum a SKILL.md file
            </CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="p-4 bg-muted rounded text-sm overflow-x-auto">
{`my-skill/
├── SKILL.md      # Required: instructions + metadata
├── scripts/      # Optional: executable code
├── references/   # Optional: documentation
└── assets/       # Optional: templates, resources`}
            </pre>
          </CardContent>
        </Card>
      </section>

      {/* Progressive Disclosure */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">How Skills Work</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold mb-2">1</div>
              <CardTitle className="text-lg">Discovery</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                At startup, agents load only the name and description of each available skill.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold mb-2">2</div>
              <CardTitle className="text-lg">Activation</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                When a task matches a skill&apos;s description, the agent reads the full SKILL.md instructions.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold mb-2">3</div>
              <CardTitle className="text-lg">Execution</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                The agent follows the instructions, optionally loading referenced files or executing code.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Benefits */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Benefits</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <Users className="h-6 w-6 text-primary mb-2" />
              <CardTitle className="text-lg">For Skill Authors</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Build capabilities once and deploy them across multiple agent products.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Zap className="h-6 w-6 text-primary mb-2" />
              <CardTitle className="text-lg">For Compatible Agents</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Support for skills lets end users give agents new capabilities out of the box.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Shield className="h-6 w-6 text-primary mb-2" />
              <CardTitle className="text-lg">For Teams & Enterprises</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Capture organizational knowledge in portable, version-controlled packages.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Package className="h-6 w-6 text-primary mb-2" />
              <CardTitle className="text-lg">Open Standard</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                The Agent Skills format was developed by Anthropic and released as an open standard.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA */}
      <section className="text-center">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="py-8">
            <h3 className="text-xl font-bold mb-2">Get Started</h3>
            <p className="text-muted-foreground mb-4">
              Browse the marketplace to discover skills or create your own
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/marketplace">
                <Button size="lg">
                  Browse Marketplace
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/docs/specification">
                <Button size="lg" variant="outline">
                  View Specification
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
