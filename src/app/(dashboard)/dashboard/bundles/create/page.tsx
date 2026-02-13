'use client';

import { useState, useEffect } from 'react';
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

interface Skill {
  id: string;
  name: string;
  description: string | null;
}

export default function CreateBundlePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);

  useEffect(() => {
    async function fetchSkills() {
      try {
        const res = await fetch('/api/skills?mine=true');
        if (res.ok) {
          const data = await res.json();
          setSkills(data.skills || []);
        }
      } catch (err) {
        console.error('Failed to fetch skills:', err);
      }
    }
    fetchSkills();
  }, []);

  function toggleSkill(skillId: string) {
    setSelectedSkills((prev) =>
      prev.includes(skillId)
        ? prev.filter((id) => id !== skillId)
        : [...prev, skillId]
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
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
            Create a bundle to group related skills together
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Bundle Name</Label>
              <Input
                id="name"
                name="name"
                placeholder="My Bundle"
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                name="description"
                placeholder="A short description of your bundle"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label>Select Skills</Label>
              {skills.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No skills available. Create some skills first.
                </p>
              ) : (
                <div className="border rounded-lg p-4 max-h-60 overflow-y-auto space-y-2">
                  {skills.map((skill) => (
                    <div key={skill.id} className="flex items-center gap-2">
                      <Checkbox
                        id={skill.id}
                        checked={selectedSkills.includes(skill.id)}
                        onCheckedChange={() => toggleSkill(skill.id)}
                      />
                      <label htmlFor={skill.id} className="text-sm cursor-pointer">
                        {skill.name}
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="flex gap-2">
              <Button type="submit" disabled={loading || selectedSkills.length === 0}>
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
