import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Folder, Code, Shield, BookOpen } from 'lucide-react';

export default function SpecificationPage() {
  return (
    <div className="container mx-auto py-8 max-w-4xl">
      {/* Breadcrumb */}
      <div className="mb-6">
        <Link href="/docs" className="text-sm text-muted-foreground hover:text-foreground">
          &larr; Back to Documentation
        </Link>
      </div>

      <h1 className="text-4xl font-bold mb-4">Specification</h1>
      <p className="text-xl text-muted-foreground mb-8">
        The complete format specification for Agent Skills
      </p>

      {/* Directory Structure */}
      <section className="mb-12">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Folder className="h-5 w-5" />
              Directory Structure
            </CardTitle>
          </CardHeader>
          <CardContent className="prose prose-neutral dark:prose-invert max-w-none">
            <p>
              A skill is a directory containing at minimum a <code>SKILL.md</code> file:
            </p>
            <pre className="p-4 bg-muted rounded text-sm overflow-x-auto">
{`skill-name/
└── SKILL.md          # Required`}
            </pre>
          </CardContent>
        </Card>
      </section>

      {/* SKILL.md Format */}
      <section className="mb-12">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              SKILL.md Format
            </CardTitle>
            <CardDescription>
              The SKILL.md file must contain YAML frontmatter followed by Markdown content
            </CardDescription>
          </CardHeader>
          <CardContent className="prose prose-neutral dark:prose-invert max-w-none">
            <h3>Required Frontmatter</h3>
            <pre className="p-4 bg-muted rounded text-sm overflow-x-auto">
{`---
name: skill-name
description: A description of what this skill does and when to use it.
---`}
            </pre>

            <h3>With Optional Fields</h3>
            <pre className="p-4 bg-muted rounded text-sm overflow-x-auto">
{`---
name: pdf-processing
description: Extract text and tables from PDF files, fill forms, merge documents.
license: Apache-2.0
metadata:
  author: example-org
  version: "1.0"
---`}
            </pre>

            <h3>Field Reference</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-4">Field</th>
                    <th className="text-left py-2 px-4">Required</th>
                    <th className="text-left py-2 px-4">Constraints</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="py-2 px-4"><code>name</code></td>
                    <td className="py-2 px-4">Yes</td>
                    <td className="py-2 px-4">Max 64 characters. Lowercase letters, numbers, and hyphens only.</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 px-4"><code>description</code></td>
                    <td className="py-2 px-4">Yes</td>
                    <td className="py-2 px-4">Max 1024 characters. Describes what the skill does and when to use it.</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 px-4"><code>license</code></td>
                    <td className="py-2 px-4">No</td>
                    <td className="py-2 px-4">License name or reference to a bundled license file.</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 px-4"><code>compatibility</code></td>
                    <td className="py-2 px-4">No</td>
                    <td className="py-2 px-4">Max 500 characters. Environment requirements.</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 px-4"><code>metadata</code></td>
                    <td className="py-2 px-4">No</td>
                    <td className="py-2 px-4">Arbitrary key-value mapping for additional metadata.</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-4"><code>allowed-tools</code></td>
                    <td className="py-2 px-4">No</td>
                    <td className="py-2 px-4">Space-delimited list of pre-approved tools. (Experimental)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Name Field */}
      <section className="mb-12">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Name Field Constraints</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-neutral dark:prose-invert max-w-none">
            <p>The required <code>name</code> field:</p>
            <ul>
              <li>Must be 1-64 characters</li>
              <li>May only contain unicode lowercase alphanumeric characters and hyphens (<code>a-z</code> and <code>-</code>)</li>
              <li>Must not start or end with <code>-</code></li>
              <li>Must not contain consecutive hyphens (<code>--</code>)</li>
              <li>Must match the parent directory name</li>
            </ul>

            <h4>Invalid Examples</h4>
            <pre className="p-4 bg-muted rounded text-sm overflow-x-auto text-red-500">
{`name: PDF-Processing  # uppercase not allowed
name: -pdf            # cannot start with hyphen
name: pdf--processing # consecutive hyphens not allowed`}
            </pre>
          </CardContent>
        </Card>
      </section>

      {/* Description Field */}
      <section className="mb-12">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Description Field</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-neutral dark:prose-invert max-w-none">
            <p>The required <code>description</code> field:</p>
            <ul>
              <li>Must be 1-1024 characters</li>
              <li>Should describe both what the skill does and when to use it</li>
              <li>Should include specific keywords that help agents identify relevant tasks</li>
            </ul>

            <h4>Good Example</h4>
            <pre className="p-4 bg-muted rounded text-sm overflow-x-auto text-green-500">
{`description: Extracts text and tables from PDF files, fills PDF forms,
and merges multiple PDFs. Use when working with PDF documents or when
the user mentions PDFs, forms, or document extraction.`}
            </pre>

            <h4>Poor Example</h4>
            <pre className="p-4 bg-muted rounded text-sm overflow-x-auto text-red-500">
{`description: Helps with PDFs.`}
            </pre>
          </CardContent>
        </Card>
      </section>

      {/* Body Content */}
      <section className="mb-12">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Body Content</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-neutral dark:prose-invert max-w-none">
            <p>
              The Markdown body after the frontmatter contains the skill instructions. There are
              no format restrictions. Write whatever helps agents perform the task effectively.
            </p>
            <p>Recommended sections:</p>
            <ul>
              <li>Step-by-step instructions</li>
              <li>Examples of inputs and outputs</li>
              <li>Common edge cases</li>
            </ul>
            <p className="text-muted-foreground text-sm">
              Note: The agent will load this entire file once it&apos;s decided to activate a skill.
              Consider splitting longer <code>SKILL.md</code> content into referenced files.
            </p>
          </CardContent>
        </Card>
      </section>

      {/* Optional Directories */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Optional Directories</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <Code className="h-6 w-6 text-primary mb-2" />
              <CardTitle className="text-lg">scripts/</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                Contains executable code that agents can run. Scripts should be self-contained
                or clearly document dependencies. Supported languages depend on the agent implementation.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <BookOpen className="h-6 w-6 text-primary mb-2" />
              <CardTitle className="text-lg">references/</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                Contains additional documentation that agents can read when needed:
                REFERENCE.md, FORMS.md, domain-specific files. Keep files focused and small.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Folder className="h-6 w-6 text-primary mb-2" />
              <CardTitle className="text-lg">assets/</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                Contains static resources: templates, images, data files. Agents load
                these on demand, so smaller files mean less use of context.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Progressive Disclosure */}
      <section className="mb-12">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Progressive Disclosure
            </CardTitle>
            <CardDescription>
              Skills should be structured for efficient use of context
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0">1</div>
                <div>
                  <p className="font-medium">Metadata (~100 tokens)</p>
                  <p className="text-sm text-muted-foreground">
                    The <code>name</code> and <code>description</code> fields are loaded at startup for all skills
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0">2</div>
                <div>
                  <p className="font-medium">Instructions (&lt;5000 tokens recommended)</p>
                  <p className="text-sm text-muted-foreground">
                    The full <code>SKILL.md</code> body is loaded when the skill is activated
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0">3</div>
                <div>
                  <p className="font-medium">Resources (as needed)</p>
                  <p className="text-sm text-muted-foreground">
                    Files in <code>scripts/</code>, <code>references/</code>, or <code>assets/</code> are loaded only when required
                  </p>
                </div>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              Keep your main <code>SKILL.md</code> under 500 lines. Move detailed reference material to separate files.
            </p>
          </CardContent>
        </Card>
      </section>

      {/* File References */}
      <section className="mb-12">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">File References</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-neutral dark:prose-invert max-w-none">
            <p>
              When referencing other files in your skill, use relative paths from the skill root:
            </p>
            <pre className="p-4 bg-muted rounded text-sm overflow-x-auto">
{`See [the reference guide](references/REFERENCE.md) for details.

Run the extraction script:
scripts/extract.py`}
            </pre>
            <p className="text-sm text-muted-foreground">
              Keep file references one level deep from <code>SKILL.md</code>. Avoid deeply nested reference chains.
            </p>
          </CardContent>
        </Card>
      </section>

      {/* Validation */}
      <section className="mb-12">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Validation</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-neutral dark:prose-invert max-w-none">
            <p>
              Use the <code>skills-ref</code> reference library to validate your skills:
            </p>
            <pre className="p-4 bg-muted rounded text-sm overflow-x-auto">
{`skills-ref validate ./my-skill`}
            </pre>
            <p className="text-sm text-muted-foreground">
              This checks that your <code>SKILL.md</code> frontmatter is valid and follows all naming conventions.
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
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
