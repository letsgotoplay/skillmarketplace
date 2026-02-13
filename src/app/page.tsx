import Link from 'next/link';
import { prisma } from '@/lib/db';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';
import {
  ArrowRight,
  Shield,
  Zap,
  Users,
  CheckCircle,
  Star,
  Download,
  ExternalLink,
  Github,
  Code,
  Lock,
  BarChart3,
} from 'lucide-react';

const features = [
  {
    icon: Shield,
    title: 'Security Scanned',
    description: 'Every skill undergoes automated security analysis before publication.',
  },
  {
    icon: CheckCircle,
    title: 'Validated & Tested',
    description: 'Skills are tested in isolated sandboxes to ensure reliability.',
  },
  {
    icon: Zap,
    title: 'One-Click Install',
    description: 'Install skills directly to your AI agent with a single command.',
  },
  {
    icon: Users,
    title: 'Team Collaboration',
    description: 'Share skills privately within your organization.',
  },
  {
    icon: Lock,
    title: 'Access Control',
    description: 'Fine-grained permissions for skill access and distribution.',
  },
  {
    icon: BarChart3,
    title: 'Analytics',
    description: 'Track usage, downloads, and performance metrics.',
  },
];

const externalSources = [
  {
    name: 'skillsmp.com',
    description: 'Massive independent marketplace with 160k+ skills for Claude Code, Codex, ChatGPT.',
    url: 'https://skillsmp.com',
    highlight: '160k+ skills',
  },
  {
    name: 'claude.com/skills',
    description: 'Official Claude skills hub from Anthropic with skill creator tool.',
    url: 'https://claude.com/skills',
    highlight: 'Official',
  },
  {
    name: 'Anthropic GitHub',
    description: 'Official Anthropic skills repository on GitHub.',
    url: 'https://github.com/anthropics/skills',
    highlight: 'Open Source',
  },
];

export default async function HomePage() {
  // Get featured public skills
  const featuredSkills = await prisma.skill.findMany({
    where: {
      visibility: 'PUBLIC',
    },
    include: {
      author: { select: { name: true } },
      stats: true,
      versions: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        include: {
          scans: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      },
    },
    orderBy: {
      stats: {
        downloadsCount: 'desc',
      },
    },
    take: 6,
  });

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-background" />
          <div className="container relative py-20 md:py-32">
            <div className="mx-auto max-w-3xl text-center">
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl mb-6">
                The Enterprise Marketplace for{' '}
                <span className="text-primary">AI Agent Skills</span>
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                Discover, validate, and deploy AI agent skills with enterprise-grade security.
                Browse thousands of pre-built skills or share your own.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/marketplace">
                  <Button size="lg" className="w-full sm:w-auto">
                    Browse Marketplace
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/register">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto">
                    Get Started Free
                  </Button>
                </Link>
              </div>
            </div>

            {/* Stats */}
            <div className="mt-16 grid gap-8 md:grid-cols-3 text-center">
              <div>
                <div className="text-4xl font-bold text-primary">{featuredSkills.length}+</div>
                <div className="text-muted-foreground">Public Skills</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-primary">100%</div>
                <div className="text-muted-foreground">Security Scanned</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-primary">Free</div>
                <div className="text-muted-foreground">Open Platform</div>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Skills */}
        {featuredSkills.length > 0 && (
          <section className="py-16 bg-muted/30">
            <div className="container">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-3xl font-bold">Featured Skills</h2>
                  <p className="text-muted-foreground">Popular skills from our marketplace</p>
                </div>
                <Link href="/marketplace">
                  <Button variant="outline">
                    View All
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {featuredSkills.map((skill) => {
                  const latestVersion = skill.versions[0];
                  const securityScore = latestVersion?.scans[0]?.score;

                  return (
                    <Link key={skill.id} href={`/marketplace/${skill.slug}`}>
                      <Card className="h-full hover:border-primary transition-colors cursor-pointer">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <CardTitle className="text-lg">{skill.name}</CardTitle>
                            {securityScore !== null && securityScore !== undefined && (
                              <span
                                className={`text-xs px-2 py-1 rounded-full ${
                                  securityScore >= 80
                                    ? 'bg-green-100 text-green-700'
                                    : securityScore >= 60
                                    ? 'bg-yellow-100 text-yellow-700'
                                    : 'bg-red-100 text-red-700'
                                }`}
                              >
                                <Shield className="h-3 w-3 inline mr-1" />
                                {securityScore}
                              </span>
                            )}
                          </div>
                          <CardDescription className="line-clamp-2">
                            {skill.description || 'No description'}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center justify-between text-sm text-muted-foreground">
                            <span>by {skill.author.name || 'Anonymous'}</span>
                            <span className="flex items-center gap-1">
                              <Download className="h-3 w-3" />
                              {skill.stats?.downloadsCount || 0}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* Features */}
        <section id="features" className="py-16">
          <div className="container">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Enterprise-Grade Features</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Everything you need to safely discover, validate, and deploy AI agent skills
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => (
                <Card key={feature.title}>
                  <CardHeader>
                    <feature.icon className="h-10 w-10 text-primary mb-2" />
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* External Sources */}
        <section className="py-16 bg-muted/30">
          <div className="container">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">More Skill Sources</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Discover skills from other popular marketplaces and repositories
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {externalSources.map((source) => (
                <a
                  key={source.name}
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group"
                >
                  <Card className="h-full hover:border-primary transition-colors">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg group-hover:text-primary transition-colors">
                          {source.name}
                        </CardTitle>
                        <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                      <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full w-fit">
                        {source.highlight}
                      </span>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{source.description}</p>
                    </CardContent>
                  </Card>
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20">
          <div className="container">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
              <p className="text-muted-foreground mb-8">
                Join thousands of developers using SkillHub to power their AI agents
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/register">
                  <Button size="lg">
                    Create Free Account
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/marketplace">
                  <Button size="lg" variant="outline">
                    Browse Skills
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
