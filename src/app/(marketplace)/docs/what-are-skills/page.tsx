import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, Folder, FileText, Zap, BookOpen } from 'lucide-react';

export default function WhatAreSkillsPage() {
  return (
    <div className="container mx-auto py-8 max-w-4xl">
      {/* Breadcrumb */}
      <div className="mb-6">
        <Link href="/docs" className="text-sm text-muted-foreground hover:text-foreground">
          &larr; Back to Documentation
        </Link>
      </div>

      <h1 className="text-4xl font-bold mb-4">What are Skills?</h1>
      <p className="text-xl text-muted-foreground mb-8">
        Understanding the fundamentals of Agent Skills
      </p>

      {/* Core Concept */}
      <section className="mb-12">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Folder className="h-5 w-5" />
              Core Structure
            </CardTitle>
          </CardHeader>
          <CardContent className="prose prose-neutral dark:prose-invert max-w-none">
            <p>
              At its core, a skill is a folder containing a <code>SKILL.md</code> file. This file
              includes metadata (<code>name</code> and <code>description</code>, at minimum) and
              instructions that tell an agent how to perform a specific task.
            </p>
            <p>
              Skills can also bundle scripts, templates, and reference materials.
            </p>
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
        <p className="text-muted-foreground mb-6">
          Skills use <strong>progressive disclosure</strong> to manage context efficiently:
        </p>
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold mb-2">1</div>
              <CardTitle className="text-lg">Discovery</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                At startup, agents load only the <strong>name and description</strong> of each
                available skill, just enough to know when it might be relevant.
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
                When a task matches a skill&apos;s description, the agent reads the full{' '}
                <code>SKILL.md</code> instructions into context.
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
                The agent follows the instructions, optionally loading referenced files or
                executing bundled code as needed.
              </p>
            </CardContent>
          </Card>
        </div>
        <p className="text-muted-foreground mt-6">
          This approach keeps agents fast while giving them access to more context on demand.
        </p>
      </section>

      {/* SKILL.md File */}
      <section className="mb-12">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              The SKILL.md File
            </CardTitle>
          </CardHeader>
          <CardContent className="prose prose-neutral dark:prose-invert max-w-none">
            <p>
              Every skill starts with a <code>SKILL.md</code> file containing YAML frontmatter
              and Markdown instructions:
            </p>
            <pre className="p-4 bg-muted rounded text-sm overflow-x-auto">
{`---
name: pdf-processing
description: Extract text and tables from PDF files, fill forms, merge documents.
---

# PDF Processing

## When to use this skill
Use this skill when the user needs to work with PDF files...

## How to extract text
1. Use pdfplumber for text extraction...

## How to fill forms
...`}
            </pre>
            <h3>Required Frontmatter</h3>
            <ul>
              <li><code>name</code>: A short identifier</li>
              <li><code>description</code>: When to use this skill</li>
            </ul>
            <p>
              The Markdown body contains the actual instructions and has no specific restrictions
              on structure or content.
            </p>
          </CardContent>
        </Card>
      </section>

      {/* Key Advantages */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Key Advantages</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <BookOpen className="h-6 w-6 text-primary mb-2" />
              <CardTitle className="text-lg">Self-Documenting</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                A skill author or user can read a <code>SKILL.md</code> and understand what it
                does, making skills easy to audit and improve.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Zap className="h-6 w-6 text-primary mb-2" />
              <CardTitle className="text-lg">Extensible</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Skills can range in complexity from just text instructions to executable code,
                assets, and templates.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Folder className="h-6 w-6 text-primary mb-2" />
              <CardTitle className="text-lg">Portable</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Skills are just files, so they&apos;re easy to edit, version, and share.
              </p>
            </CardContent>
          </Card>
        </div>
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
              <Link href="/docs/specification">
                <Button size="lg">
                  View Specification
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/docs/integrate-skills">
                <Button size="lg" variant="outline">
                  Integrate Skills
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
