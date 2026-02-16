import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Building2,
  Clock,
  ArrowRight,
  FileText,
} from 'lucide-react';

// Blog posts data
const blogPosts = [
  {
    slug: 'introducing-skillhub-cli',
    title: 'Introducing SkillHub CLI: Manage Skills from Your Terminal',
    description: 'A powerful command-line tool to search, install, and manage AI agent skills across Claude Code, Cursor, GitHub Copilot, and 8 other platforms.',
    date: 'February 2026',
    category: 'Announcement',
    tags: ['CLI', 'Tools'],
    readTime: '6 min read',
    featured: true,
  },
  {
    slug: 'why-enterprise-skill-hub',
    title: 'Why Build an Enterprise Internal Skill Hub?',
    description: 'A deep dive into why enterprises need their own AI agent skill repositories, and how security-first design enables safe adoption of agentic AI at scale.',
    date: 'February 2026',
    category: 'Engineering',
    tags: ['Enterprise', 'Security'],
    readTime: '8 min read',
    featured: false,
  },
  {
    slug: 'developer-guide',
    title: 'Developer Guide: Local Setup & Operations',
    description: 'A comprehensive guide for developers to set up, run, and operate the SkillHub marketplace locally. Covers Prisma database, MinIO storage, Redis queues, and more.',
    date: 'February 2026',
    category: 'Documentation',
    tags: ['Developer', 'Tutorial'],
    readTime: '12 min read',
    featured: false,
  },
];

export default function BlogPage() {
  const featuredPost = blogPosts.find(post => post.featured);

  return (
    <div className="container mx-auto py-8 max-w-5xl">
      {/* Header */}
      <div className="mb-12">
        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground mb-4 inline-block">
          &larr; Back to Home
        </Link>
        <h1 className="text-4xl font-bold mb-4">Blog</h1>
        <p className="text-xl text-muted-foreground">
          Insights, guides, and best practices for building and managing enterprise AI agent skills.
        </p>
      </div>

      {/* Featured Post */}
      {featuredPost && (
        <section className="mb-12">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">
            Featured Article
          </h2>
          <Link href={`/blog/${featuredPost.slug}`}>
            <Card className="hover:border-primary transition-all duration-200 cursor-pointer group overflow-hidden">
              <div className="md:flex">
                <div className="md:flex-1 p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="secondary">{featuredPost.category}</Badge>
                    {featuredPost.tags.map(tag => (
                      <Badge key={tag} variant="outline">{tag}</Badge>
                    ))}
                  </div>
                  <CardTitle className="text-2xl mb-3 group-hover:text-primary transition-colors">
                    {featuredPost.title}
                  </CardTitle>
                  <CardDescription className="text-base mb-4">
                    {featuredPost.description}
                  </CardDescription>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      <span>SkillHub Team</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{featuredPost.readTime}</span>
                    </div>
                    <span>{featuredPost.date}</span>
                  </div>
                </div>
                <div className="md:w-48 bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center p-8">
                  <ArrowRight className="h-12 w-12 text-primary/30 group-hover:text-primary group-hover:translate-x-2 transition-all duration-200" />
                </div>
              </div>
            </Card>
          </Link>
        </section>
      )}

      {/* All Posts */}
      <section>
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">
          All Articles
        </h2>
        <div className="grid md:grid-cols-2 gap-6">
          {blogPosts.map((post) => (
            <Link key={post.slug} href={`/blog/${post.slug}`}>
              <Card className="h-full hover:border-primary transition-all duration-200 cursor-pointer group">
                <CardHeader>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary">{post.category}</Badge>
                    {post.tags.slice(0, 1).map(tag => (
                      <Badge key={tag} variant="outline">{tag}</Badge>
                    ))}
                  </div>
                  <CardTitle className="text-lg group-hover:text-primary transition-colors">
                    {post.title}
                  </CardTitle>
                  <CardDescription className="line-clamp-2">
                    {post.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{post.readTime}</span>
                      </div>
                      <span>{post.date}</span>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all duration-200" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="mt-16">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="py-8 text-center">
            <FileText className="h-12 w-12 mx-auto mb-4 text-primary" />
            <h3 className="text-xl font-bold mb-2">Stay Updated</h3>
            <p className="text-muted-foreground mb-4 max-w-md mx-auto">
              Get the latest articles, guides, and updates about enterprise AI agent skills delivered to your inbox.
            </p>
            <Link href="/docs/getting-started">
              <span className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </span>
            </Link>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
