'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Settings, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

type Visibility = 'PUBLIC' | 'TEAM_ONLY' | 'PRIVATE';

interface Team {
  id: string;
  name: string;
}

interface VisibilityEditorProps {
  skillId: string;
  currentVisibility: Visibility;
  currentTeamId?: string | null;
  isOwner: boolean;
  onVisibilityChange?: (newVisibility: Visibility) => void;
}

const VISIBILITY_CONFIG: Record<Visibility, { label: string; description: string; color: string }> = {
  PUBLIC: {
    label: 'Public',
    description: 'Visible to everyone in the marketplace',
    color: 'bg-green-100 text-green-700',
  },
  TEAM_ONLY: {
    label: 'Team Only',
    description: 'Visible only to members of your team',
    color: 'bg-blue-100 text-blue-700',
  },
  PRIVATE: {
    label: 'Private',
    description: 'Only visible to you',
    color: 'bg-gray-100 text-gray-700',
  },
};

export function VisibilityEditor({
  skillId,
  currentVisibility,
  currentTeamId,
  isOwner,
  onVisibilityChange,
}: VisibilityEditorProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [visibility, setVisibility] = useState<Visibility>(currentVisibility);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string>(currentTeamId || '');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingTeams, setIsFetchingTeams] = useState(false);

  // Fetch user's teams when dialog opens
  useEffect(() => {
    if (open) {
      setIsFetchingTeams(true);
      fetch('/api/teams')
        .then((res) => res.json())
        .then((data) => {
          setTeams(data.teams || []);
          // Set default team if user has teams and current visibility is TEAM_ONLY
          if (data.teams?.length > 0 && !selectedTeamId) {
            setSelectedTeamId(data.teams[0].id);
          }
        })
        .catch(console.error)
        .finally(() => setIsFetchingTeams(false));
    }
  }, [open, selectedTeamId]);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const body: { visibility: Visibility; teamId?: string | null } = { visibility };

      if (visibility === 'TEAM_ONLY') {
        body.teamId = selectedTeamId;
      } else {
        body.teamId = null;
      }

      const res = await fetch(`/api/skills/${skillId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        onVisibilityChange?.(visibility);
        setOpen(false);
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to update visibility');
      }
    } catch (error) {
      console.error('Failed to update visibility:', error);
      alert('Failed to update visibility');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOwner) return null;

  const hasTeams = teams.length > 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4 mr-2" />
          Edit Visibility
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Skill Visibility</DialogTitle>
          <DialogDescription>
            Control who can see and access this skill.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Current Status */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Current:</span>
            <Badge className={VISIBILITY_CONFIG[currentVisibility].color}>
              {VISIBILITY_CONFIG[currentVisibility].label}
            </Badge>
          </div>

          {/* Visibility Options */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Visibility</label>
            <Select value={visibility} onValueChange={(v) => setVisibility(v as Visibility)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PUBLIC">
                  <div className="flex flex-col items-start">
                    <span>Public</span>
                    <span className="text-xs text-muted-foreground">Visible to everyone</span>
                  </div>
                </SelectItem>
                <SelectItem value="PRIVATE">
                  <div className="flex flex-col items-start">
                    <span>Private</span>
                    <span className="text-xs text-muted-foreground">Only visible to you</span>
                  </div>
                </SelectItem>
                {hasTeams && (
                  <SelectItem value="TEAM_ONLY">
                    <div className="flex flex-col items-start">
                      <span>Team Only</span>
                      <span className="text-xs text-muted-foreground">Visible to team members</span>
                    </div>
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <p className="text-sm text-muted-foreground">
            {VISIBILITY_CONFIG[visibility].description}
          </p>

          {/* Team Selection (only for TEAM_ONLY) */}
          {visibility === 'TEAM_ONLY' && hasTeams && (
            <div className="space-y-3">
              <label className="text-sm font-medium">Select Team</label>
              <Select value={selectedTeamId} onValueChange={setSelectedTeamId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a team" />
                </SelectTrigger>
                <SelectContent>
                  {teams.map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* No teams warning */}
          {visibility === 'TEAM_ONLY' && !hasTeams && !isFetchingTeams && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-sm text-yellow-800">
                You are not a member of any team. Join a team first to use Team Only visibility.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading || (visibility === 'TEAM_ONLY' && !selectedTeamId)}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
