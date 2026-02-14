'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus, Loader2 } from 'lucide-react';
import { uploadSkillVersion } from '@/app/actions/skills';

interface NewVersionDialogProps {
  skillId: string;
  skillName: string;
  currentVersion: string;
}

export function NewVersionDialog({ skillId, skillName, currentVersion }: NewVersionDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setValidationErrors([]);
    setLoading(true);

    const formData = new FormData(event.currentTarget);

    try {
      const result = await uploadSkillVersion(skillId, formData);

      if (!result.success) {
        if (result.validationErrors) {
          setValidationErrors(result.validationErrors);
        } else {
          setError(result.error || 'Upload failed');
        }
        setLoading(false);
        return;
      }

      setOpen(false);
      // Refresh the page to show the new version
      router.refresh();
    } catch (err) {
      setError('An unexpected error occurred');
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Plus className="h-4 w-4" />
          New Version
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Upload New Version</DialogTitle>
          <DialogDescription>
            Upload a new version of <strong>{skillName}</strong>. Current version: {currentVersion}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
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

          <div className="space-y-2">
            <Label htmlFor="file">
              Skill Package (ZIP) <span className="text-destructive">*</span>
            </Label>
            <Input
              id="file"
              name="file"
              type="file"
              accept=".zip"
              required
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              Must contain a SKILL.md file with an updated version number.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="changelog">Changelog</Label>
            <textarea
              id="changelog"
              name="changelog"
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder="Describe changes in this version..."
              disabled={loading}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                'Upload Version'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
