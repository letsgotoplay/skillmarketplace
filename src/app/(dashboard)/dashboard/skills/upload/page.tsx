'use client';

import { useState, useRef, useEffect } from 'react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { uploadSkill } from '@/app/actions/skills';
import { Upload, Loader2, ChevronRight, ExternalLink } from 'lucide-react';

interface DiscoveredSkill {
  path: string;
  name: string;
  description: string;
}

interface ScanResult {
  repo: {
    owner: string;
    name: string;
    url: string;
  };
  skills: DiscoveredSkill[];
}

export default function UploadSkillPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Feature flag state
  const [githubImportEnabled, setGithubImportEnabled] = useState(true);

  // Common state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // GitHub import state
  const [githubUrl, setGithubUrl] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [selectedSkill, setSelectedSkill] = useState<string>('');

  // Check feature flag on mount
  useEffect(() => {
    fetch('/api/features')
      .then(res => res.json())
      .then(data => {
        if (data.githubImport !== undefined) {
          setGithubImportEnabled(data.githubImport);
        }
      })
      .catch(() => {
        // Default to enabled if check fails
      });
  }, []);

  async function handleFileSubmit(event: React.FormEvent<HTMLFormElement>) {
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

  async function handleScanRepo() {
    if (!githubUrl.trim()) {
      setError('Please enter a GitHub URL');
      return;
    }

    setScanning(true);
    setError(null);
    setScanResult(null);
    setSelectedSkill('');

    try {
      const response = await fetch(`/api/skills/import?url=${encodeURIComponent(githubUrl)}`);
      const data = await response.json();

      if (!data.success) {
        setError(data.error || 'Failed to scan repository');
        setScanning(false);
        return;
      }

      setScanResult(data);

      // Auto-select if only one skill
      if (data.skills.length === 1) {
        setSelectedSkill(data.skills[0].path);
      }
    } catch (err) {
      setError('Failed to connect to server');
    } finally {
      setScanning(false);
    }
  }

  async function handleImportSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setWarnings([]);
    setValidationErrors([]);
    setLoading(true);

    if (!scanResult) {
      setError('Please scan a repository first');
      setLoading(false);
      return;
    }

    // GitHub import: always PUBLIC, no other params
    const body = {
      url: githubUrl,
      skillPath: selectedSkill,
      visibility: 'PUBLIC',
    };

    try {
      const response = await fetch('/api/skills/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const result = await response.json();

      if (!result.success) {
        if (result.validationErrors) {
          setValidationErrors(result.validationErrors);
        } else {
          setError(result.error || 'Import failed');
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

  const renderAlerts = () => (
    <>
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
        <div className="rounded-md bg-yellow-100 p-3 text-sm text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200">
          <p className="font-medium mb-1">Warnings:</p>
          <ul className="list-disc list-inside">
            {warnings.map((warn, i) => (
              <li key={i}>{warn}</li>
            ))}
          </ul>
        </div>
      )}
    </>
  );

  const renderOptionalFields = (disabled: boolean) => (
    <>
      <div className="border-t pt-4">
        <p className="text-sm text-muted-foreground mb-4">
          Optional fields - leave empty for defaults
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="visibility">Visibility</Label>
        <select
          id="visibility"
          name="visibility"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          defaultValue="PUBLIC"
          disabled={disabled}
        >
          <option value="PUBLIC">Public</option>
          <option value="TEAM_ONLY">Team Only</option>
          <option value="PRIVATE">Private</option>
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="category">Category (optional)</Label>
        <select
          id="category"
          name="category"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          disabled={disabled}
        >
          <option value="">Auto-detect by AI</option>
          <option value="DEVELOPMENT">Development</option>
          <option value="SECURITY">Security</option>
          <option value="DATA">Data</option>
          <option value="AIML">AI/ML</option>
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
          disabled={disabled}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="changelog">Changelog (optional)</Label>
        <textarea
          id="changelog"
          name="changelog"
          className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          placeholder="Describe changes in this version..."
          disabled={disabled}
        />
      </div>
    </>
  );

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Upload Skill</CardTitle>
          <CardDescription>
            {githubImportEnabled
              ? 'Upload a skill package or import from a public GitHub repository.'
              : 'Upload a skill package as a ZIP file.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {githubImportEnabled ? (
            <Tabs defaultValue="upload" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="upload" className="flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Upload ZIP
                </TabsTrigger>
                <TabsTrigger value="import" className="flex items-center gap-2">
                  <ExternalLink className="h-4 w-4" />
                  GitHub Import
                </TabsTrigger>
              </TabsList>

              {/* Upload Tab */}
              <TabsContent value="upload">
                <form onSubmit={handleFileSubmit} className="space-y-6">
                  {renderAlerts()}

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

                  {renderOptionalFields(loading)}

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
              </TabsContent>

              {/* GitHub Import Tab - Simplified */}
              <TabsContent value="import">
                <form onSubmit={handleImportSubmit} className="space-y-6">
                  {renderAlerts()}

                  {/* URL Input */}
                  <div className="space-y-2">
                    <Label htmlFor="githubUrl">
                      GitHub URL <span className="text-destructive">*</span>
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        id="githubUrl"
                        type="text"
                        placeholder="owner/repo or https://github.com/owner/repo"
                        value={githubUrl}
                        onChange={(e) => setGithubUrl(e.target.value)}
                        disabled={scanning || loading}
                      />
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={handleScanRepo}
                        disabled={scanning || loading || !githubUrl.trim()}
                      >
                        {scanning ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Scan'}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Only public repositories can be imported. Imported skills are public by default.
                    </p>
                  </div>

                  {/* Scan Results */}
                  {scanResult && (
                    <div className="space-y-3 border rounded-lg p-4">
                      <div className="text-sm">
                        <span className="font-medium">Repository:</span>{' '}
                        <a
                          href={scanResult.repo.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          {scanResult.repo.owner}/{scanResult.repo.name}
                        </a>
                      </div>

                      <div className="space-y-2">
                        <Label>
                          {scanResult.skills.length > 1
                            ? `Found ${scanResult.skills.length} skills - Select one:`
                            : 'Skill found:'}
                        </Label>

                        {scanResult.skills.length === 1 ? (
                          <div className="flex items-center gap-2 p-3 border rounded-md bg-muted/50">
                            <ChevronRight className="h-4 w-4 text-primary" />
                            <div>
                              <div className="font-medium">{scanResult.skills[0].name}</div>
                              <div className="text-sm text-muted-foreground">
                                {scanResult.skills[0].description}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {scanResult.skills.map((skill) => (
                              <label
                                key={skill.path || 'root'}
                                className={`flex items-start gap-3 p-3 border rounded-md cursor-pointer transition-colors ${
                                  selectedSkill === skill.path
                                    ? 'border-primary bg-primary/5'
                                    : 'hover:bg-muted/50'
                                }`}
                              >
                                <input
                                  type="radio"
                                  name="selectedSkill"
                                  value={skill.path}
                                  checked={selectedSkill === skill.path}
                                  onChange={() => setSelectedSkill(skill.path)}
                                  className="mt-1"
                                />
                                <div>
                                  <div className="font-medium">{skill.name}</div>
                                  <div className="text-sm text-muted-foreground">
                                    {skill.description}
                                  </div>
                                  {skill.path && (
                                    <div className="text-xs text-muted-foreground mt-1">
                                      Path: {skill.path}
                                    </div>
                                  )}
                                </div>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-4">
                    <Button
                      type="submit"
                      disabled={loading || !scanResult || (scanResult.skills.length > 1 && !selectedSkill)}
                    >
                      {loading ? 'Importing...' : 'Import Skill'}
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
              </TabsContent>
            </Tabs>
          ) : (
            /* Feature disabled: Only show upload form */
            <form onSubmit={handleFileSubmit} className="space-y-6">
              {renderAlerts()}

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

              {renderOptionalFields(loading)}

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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
