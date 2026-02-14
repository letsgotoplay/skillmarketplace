'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Search, Loader2 } from 'lucide-react';

interface Skill {
  id: string;
  name: string;
  description: string | null;
  slug: string;
}

interface BundleSkill {
  skill: Skill;
}

interface Bundle {
  id: string;
  name: string;
  description: string | null;
  visibility: string;
  teamId: string;
  skills: BundleSkill[];
}

export default function EditBundlePage() {
  const router = useRouter();
  const params = useParams();
  const bundleId = params.id as string;

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bundle, setBundle] = useState<Bundle | null>(null);
  const [allSkills, setAllSkills] = useState<Skill[]>([]);
  const [displayedSkills, setDisplayedSkills] = useState<Skill[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch bundle details
  useEffect(() => {
    async function fetchBundle() {
      try {
        const res = await fetch(`/api/bundles/${bundleId}`);
        if (!res.ok) throw new Error('Failed to fetch bundle');
        const data = await res.json();
        setBundle(data);
        setSelectedSkills(data.skills?.map((bs: BundleSkill) => bs.skill.id) || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load bundle');
      } finally {
        setFetching(false);
      }
    }
    fetchBundle();
  }, [bundleId]);

  // Fetch all public skills
  useEffect(() => {
    async function fetchSkills() {
      try {
        const res = await fetch('/api/skills?limit=100');
        if (res.ok) {
          const data = await res.json();
          setAllSkills(data.skills || []);
          setDisplayedSkills(data.skills || []);
        }
      } catch (err) {
        console.error('Failed to fetch skills:', err);
      }
    }
    fetchSkills();
  }, []);

  // Debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!searchQuery.trim()) {
      setDisplayedSkills(allSkills);
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/skills?search=${encodeURIComponent(searchQuery)}&limit=50`);
        if (res.ok) {
          const data = await res.json();
          setDisplayedSkills(data.skills || []);
        }
      } catch (err) {
        console.error('Search failed:', err);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, allSkills]);

  function handleToggleSkill(skillId: string, checked: boolean) {
    setSelectedSkills((prev) =>
      checked ? [...prev, skillId] : prev.filter((id) => id !== skillId)
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!bundle) return;

    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;

    try {
      const res = await fetch(`/api/bundles/${bundleId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          skillIds: selectedSkills,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update bundle');
      }

      router.push(`/dashboard/bundles/${bundleId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this bundle?')) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/bundles/${bundleId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete bundle');
      }

      router.push('/dashboard/bundles');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }

  if (fetching) {
    return (
      <div className="container mx-auto py-8 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!bundle) {
    return (
      <div className="container mx-auto py-8">
        <p className="text-muted-foreground">Bundle not found.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Edit Bundle</CardTitle>
          <CardDescription>
            Update bundle details and manage skills
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            {/* Bundle Name */}
            <div className="space-y-2">
              <Label htmlFor="name">
                Bundle Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                name="name"
                defaultValue={bundle.name}
                required
                disabled={loading}
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Input
                id="description"
                name="description"
                defaultValue={bundle.description || ''}
                disabled={loading}
              />
            </div>

            {/* Skill Selection with Search */}
            <div className="space-y-2">
              <Label>Select Skills ({selectedSkills.length} selected)</Label>

              {/* Search Input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search all public skills..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                  disabled={loading}
                />
                {searching && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </div>

              {/* Skills List */}
              <div className="border rounded-lg p-4 max-h-60 overflow-y-auto space-y-1">
                {displayedSkills.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-2">
                    {searchQuery ? 'No skills match your search.' : 'No skills available.'}
                  </p>
                ) : (
                  displayedSkills.map((skill) => {
                    const isSelected = selectedSkills.includes(skill.id);
                    return (
                      <div
                        key={skill.id}
                        className="flex items-center gap-3 p-2 rounded hover:bg-muted/50"
                      >
                        <Checkbox
                          id={`skill-${skill.id}`}
                          checked={isSelected}
                          onCheckedChange={(checked) =>
                            handleToggleSkill(skill.id, checked as boolean)
                          }
                        />
                        <label
                          htmlFor={`skill-${skill.id}`}
                          className="flex-1 cursor-pointer min-w-0"
                        >
                          <span className="text-sm font-medium">{skill.name}</span>
                          {skill.description && (
                            <p className="text-xs text-muted-foreground truncate">
                              {skill.description}
                            </p>
                          )}
                        </label>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={loading || selectedSkills.length === 0}>
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={loading}
                className="ml-auto"
              >
                Delete
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
