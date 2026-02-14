'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { uploadSkill } from '@/app/actions/skills';

export default function UploadSkillPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setWarnings([]);
    setValidationErrors([]);
    setLoading(true);

    const formData = new FormData(event.currentTarget);

    try {
      const result = await uploadSkill(formData);

      if (!result.success) {
        if (result.validationErrors) {
          setValidationErrors(result.validationErrors);
        } else {
          setError(result.error || 'Upload failed');
        }
        if (result.warnings) {
          setWarnings(result.warnings);
        }
        setLoading(false);
        return;
      }

      if (result.warnings) {
        setWarnings(result.warnings);
      }

      // Redirect to skill detail page
      if (result.skillId) {
        router.push(`/dashboard/skills/${result.skillId}`);
      } else {
        router.push('/dashboard/skills');
      }
    } catch (err) {
      setError('An unexpected error occurred');
      setLoading(false);
    }
  }

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Upload Skill</CardTitle>
          <CardDescription>
            Upload a skill package as a ZIP file. The package must contain a SKILL.md file with proper frontmatter.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            {validationErrors.length > 0 && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                <ul className="list-disc list-inside">
                  {validationErrors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            )}

            {warnings.length > 0 && (
              <div className="rounded-md bg-yellow-100 p-3 text-sm text-yellow-800">
                <p className="font-medium mb-1">Warnings:</p>
                <ul className="list-disc list-inside">
                  {warnings.map((warn, i) => (
                    <li key={i}>{warn}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Required Fields */}
            <div className="space-y-2">
              <Label htmlFor="file">
                Skill Package (ZIP) <span className="text-destructive">*</span>
              </Label>
              <Input
                ref={fileInputRef}
                id="file"
                name="file"
                type="file"
                accept=".zip"
                required
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                Must contain a SKILL.md file with proper frontmatter.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="visibility">Visibility</Label>
              <select
                id="visibility"
                name="visibility"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                defaultValue="PUBLIC"
                disabled={loading}
              >
                <option value="PUBLIC">Public</option>
                <option value="TEAM_ONLY">Team Only</option>
                <option value="PRIVATE">Private</option>
              </select>
            </div>

            {/* Divider */}
            <div className="border-t pt-4">
              <p className="text-sm text-muted-foreground mb-4">
                Optional fields - leave empty to auto-generate from SKILL.md or AI analysis
              </p>
            </div>

            {/* Optional Fields */}
            <div className="space-y-2">
              <Label htmlFor="name">Skill Name (optional)</Label>
              <Input
                id="name"
                name="name"
                type="text"
                placeholder="Will use name from SKILL.md"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <textarea
                id="description"
                name="description"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="Will use description from SKILL.md"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category (optional)</Label>
              <select
                id="category"
                name="category"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                disabled={loading}
              >
                <option value="">Auto-detect by AI</option>
                <option value="DEVELOPMENT">Development</option>
                <option value="SECURITY">Security</option>
                <option value="DATA_ANALYTICS">Data Analytics</option>
                <option value="AI_ML">AI/ML</option>
                <option value="TESTING">Testing</option>
                <option value="INTEGRATION">Integration</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Tags (optional)</Label>
              <Input
                id="tags"
                name="tags"
                type="text"
                placeholder="e.g., python, automation, api (comma separated)"
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                Leave empty for AI auto-generation.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="changelog">Changelog (optional)</Label>
              <textarea
                id="changelog"
                name="changelog"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="Describe changes in this version..."
                disabled={loading}
              />
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={loading}>
                {loading ? 'Uploading...' : 'Upload Skill'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={loading}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
