import Link from 'next/link';
import { Package, Github, Twitter, Linkedin } from 'lucide-react';

export function SiteFooter() {
  return (
    <footer className="border-t bg-muted/50">
      <div className="container py-12 md:py-16">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2">
              <Package className="h-6 w-6 text-primary" />
              <span className="font-bold text-lg">SkillHub</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              The enterprise marketplace for AI agent skills. Discover, validate, and deploy with confidence.
            </p>
            <div className="flex gap-4">
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">
                <Github className="h-5 w-5" />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Marketplace */}
          <div className="space-y-4">
            <h3 className="font-semibold">Marketplace</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/marketplace" className="text-muted-foreground hover:text-foreground">Browse Skills</Link></li>
              <li><Link href="/marketplace?category=development" className="text-muted-foreground hover:text-foreground">Development</Link></li>
              <li><Link href="/marketplace?category=security" className="text-muted-foreground hover:text-foreground">Security</Link></li>
              <li><Link href="/marketplace?category=data" className="text-muted-foreground hover:text-foreground">Data & Analytics</Link></li>
              <li><Link href="/marketplace?category=aiml" className="text-muted-foreground hover:text-foreground">AI/ML</Link></li>
              <li><Link href="/marketplace?category=testing" className="text-muted-foreground hover:text-foreground">Testing</Link></li>
              <li><Link href="/marketplace?category=integration" className="text-muted-foreground hover:text-foreground">Integration</Link></li>
            </ul>
          </div>

          {/* Resources */}
          <div className="space-y-4">
            <h3 className="font-semibold">Resources</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/docs" className="text-muted-foreground hover:text-foreground">Documentation</Link></li>
              <li><Link href="/docs/getting-started" className="text-muted-foreground hover:text-foreground">Getting Started</Link></li>
              <li><Link href="/docs/api" className="text-muted-foreground hover:text-foreground">API Reference</Link></li>
              <li><Link href="/blog" className="text-muted-foreground hover:text-foreground">Blog</Link></li>
            </ul>
          </div>

          {/* External Links */}
          <div className="space-y-4">
            <h3 className="font-semibold">Skill Sources</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="https://skillsmp.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground flex items-center gap-1"
                >
                  skillsmp.com
                  <span className="text-xs">(160k+ skills)</span>
                </a>
              </li>
              <li>
                <a
                  href="https://claude.com/skills"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground flex items-center gap-1"
                >
                  claude.com/skills
                  <span className="text-xs">(Official)</span>
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/anthropics/skills"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground flex items-center gap-1"
                >
                  Anthropic Skills
                  <span className="text-xs">(GitHub)</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} SkillHub. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm">
            <Link href="/privacy" className="text-muted-foreground hover:text-foreground">Privacy</Link>
            <Link href="/terms" className="text-muted-foreground hover:text-foreground">Terms</Link>
            <Link href="/security" className="text-muted-foreground hover:text-foreground">Security</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
