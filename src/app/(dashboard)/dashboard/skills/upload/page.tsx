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
        return;
      }

      if (result.warnings) {
        setWarnings(result.warnings);
      }

      router.push('/dashboard/skills');
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
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

            <div className="space-y-2">
              <Label htmlFor="file">Skill Package (ZIP)</Label>
              <Input
                ref={fileInputRef}
                id="file"
                name="file"
                type="file"
                accept=".zip"
                required
                disabled={loading}
              />
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
