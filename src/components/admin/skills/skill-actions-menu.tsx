'use client';

import { useState } from 'react';
import { MoreHorizontal, Eye, Trash2, Lock, Unlock, UserRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { VisibilityBadge } from './skill-status-badge';

interface Skill {
  id: string;
  name: string;
  visibility: string;
  author: {
    id: string;
    name: string | null;
    email: string;
  };
}

interface SkillActionsMenuProps {
  skill: Skill;
  onView: (skillId: string) => void;
  onDelete: (skillId: string) => Promise<void>;
  onChangeVisibility: (skillId: string, visibility: string) => Promise<void>;
  onTransferAuthor: (skillId: string, newAuthorId: string) => Promise<void>;
}

export function SkillActionsMenu({
  skill,
  onView,
  onDelete,
  onChangeVisibility,
  onTransferAuthor,
}: SkillActionsMenuProps) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [visibilityOpen, setVisibilityOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [newAuthorId, setNewAuthorId] = useState('');

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      await onDelete(skill.id);
      setDeleteOpen(false);
    } catch (error) {
      console.error('Failed to delete:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVisibilityChange = async (visibility: string) => {
    setIsLoading(true);
    try {
      await onChangeVisibility(skill.id, visibility);
      setVisibilityOpen(false);
    } catch (error) {
      console.error('Failed to change visibility:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTransfer = async () => {
    if (!newAuthorId.trim()) return;
    setIsLoading(true);
    try {
      await onTransferAuthor(skill.id, newAuthorId.trim());
      setTransferOpen(false);
      setNewAuthorId('');
    } catch (error) {
      console.error('Failed to transfer:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onView(skill.id)}>
            <Eye className="h-4 w-4 mr-2" />
            View Details
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setVisibilityOpen(true)}>
            {skill.visibility === 'PRIVATE' ? (
              <>
                <Unlock className="h-4 w-4 mr-2" />
                Change Visibility
              </>
            ) : (
              <>
                <Lock className="h-4 w-4 mr-2" />
                Change Visibility
              </>
            )}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setTransferOpen(true)}>
            <UserRound className="h-4 w-4 mr-2" />
            Transfer Author
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setDeleteOpen(true)}
            className="text-red-600 focus:text-red-600"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Skill
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Delete Confirmation */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Skill</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{skill.name}</strong>? This action
              cannot be undone. All versions, files, and related data will be permanently
              removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isLoading}>
              {isLoading ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Visibility */}
      <Dialog open={visibilityOpen} onOpenChange={setVisibilityOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Visibility</DialogTitle>
            <DialogDescription>
              Current visibility: <VisibilityBadge visibility={skill.visibility as 'PUBLIC' | 'TEAM_ONLY' | 'PRIVATE'} />
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-4">
            {['PUBLIC', 'TEAM_ONLY', 'PRIVATE'].map((v) => (
              <Button
                key={v}
                variant={skill.visibility === v ? 'default' : 'outline'}
                className="justify-start"
                onClick={() => handleVisibilityChange(v)}
                disabled={isLoading || skill.visibility === v}
              >
                {v === 'PUBLIC' && 'Public - Visible to everyone'}
                {v === 'TEAM_ONLY' && 'Team Only - Visible to team members'}
                {v === 'PRIVATE' && 'Private - Only visible to author'}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Transfer Author */}
      <Dialog open={transferOpen} onOpenChange={setTransferOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transfer Skill Author</DialogTitle>
            <DialogDescription>
              Current author: <strong>{skill.author.name || skill.author.email}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="newAuthorId">New Author ID</Label>
              <Input
                id="newAuthorId"
                placeholder="Enter user ID..."
                value={newAuthorId}
                onChange={(e) => setNewAuthorId(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                Enter the ID of the user you want to transfer this skill to.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTransferOpen(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button onClick={handleTransfer} disabled={isLoading || !newAuthorId.trim()}>
              {isLoading ? 'Transferring...' : 'Transfer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
