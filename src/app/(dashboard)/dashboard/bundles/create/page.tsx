'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
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

interface Team {
  id: string;
  name: string;
  slug: string;
}

export default function CreateBundlePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [allSkills, setAllSkills] = useState<Skill[]>([]);
  const [displayedSkills, setDisplayedSkills] = useState<Skill[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch user's teams
  useEffect(() => {
    async function fetchTeams() {
      try {
        const res = await fetch('/api/teams');
        if (res.ok) {
          const data = await res.json();
          setTeams(data.teams || []);
          if (data.teams?.length === 1) {
            setSelectedTeamId(data.teams[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to fetch teams:', err);
      }
    }
    fetchTeams();
  }, []);

  // Fetch all public skills initially
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

  // Debounced search - search via API
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // If empty query, show all skills
    if (!searchQuery.trim()) {
      setDisplayedSkills(allSkills);
      return;
    }

    // Debounce search
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

    if (!selectedTeamId) {
      setError('Please select a team');
      return;
    }

    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;

    try {
      const res = await fetch('/api/bundles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          teamId: selectedTeamId,
          skillIds: selectedSkills,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create bundle');
      }

      const bundle = await res.json();
      router.push(`/dashboard/bundles/${bundle.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Create New Bundle</CardTitle>
          <CardDescription>
            Create a bundle to group related skills together for your team
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            {/* Team Selection - Required */}
            <div className="space-y-2">
              <Label htmlFor="teamId">
                Team <span className="text-destructive">*</span>
              </Label>
              {teams.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  You are not a member of any team. Create or join a team first.
                </p>
              ) : (
                <select
                  id="teamId"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={selectedTeamId}
                  onChange={(e) => setSelectedTeamId(e.target.value)}
                  required
                  disabled={loading}
                >
                  <option value="">Select a team...</option>
                  {teams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Bundle Name - Required */}
            <div className="space-y-2">
              <Label htmlFor="name">
                Bundle Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                name="name"
                placeholder="My Bundle"
                required
                disabled={loading || !selectedTeamId}
              />
            </div>

            {/* Description - Optional */}
            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Input
                id="description"
                name="description"
                placeholder="A short description of your bundle"
                disabled={loading || !selectedTeamId}
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
              <Button
                type="submit"
                disabled={loading || !selectedTeamId || selectedSkills.length === 0}
              >
                {loading ? 'Creating...' : 'Create Bundle'}
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
