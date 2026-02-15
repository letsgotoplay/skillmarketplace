'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge, VisibilityBadge, CategoryBadge } from './skill-status-badge';
import { ExternalLink, Download, Eye, AlertCircle } from 'lucide-react';
import Link from 'next/link';

interface SkillVersion {
  id: string;
  version: string;
  changelog: string | null;
  status: string;
  specValidationPassed: boolean | null;
  aiSecurityAnalyzed: boolean;
  processingComplete: boolean;
  createdAt: string;
  creator: {
    id: string;
    name: string | null;
    email: string;
  };
  evals: Array<{
    id: string;
    status: string;
    createdAt: string;
    completedAt: string | null;
    results: Array<{
      testName: string;
      status: string;
      output: string | null;
      durationMs: number | null;
    }>;
  }>;
  scans: Array<{
    id: string;
    score: number | null;
    riskLevel: string | null;
    blockExecution: boolean;
    createdAt: string;
  }>;
}

interface Skill {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category: string;
  visibility: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    name: string | null;
    email: string;
  };
  team: {
    id: string;
    name: string;
    slug: string;
  } | null;
  stats: {
    downloadsCount: number;
    viewsCount: number;
  } | null;
  versions: SkillVersion[];
  feedback: Array<{
    id: string;
    rating: number;
    comment: string | null;
    createdAt: string;
    user: {
      id: string;
      name: string | null;
      email: string;
    };
  }>;
  downloads: Array<{
    downloadType: string;
    version: string | null;
    createdAt: string;
  }>;
}

interface SkillDetailDialogProps {
  skillId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const RISK_COLORS: Record<string, string> = {
  low: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800',
};

export function SkillDetailDialog({ skillId, open, onOpenChange }: SkillDetailDialogProps) {
  const [skill, setSkill] = useState<Skill | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (skillId && open) {
      setIsLoading(true);
      fetch(`/api/admin/skills/${skillId}`)
        .then((r) => r.json())
        .then(setSkill)
        .catch(console.error)
        .finally(() => setIsLoading(false));
    }
  }, [skillId, open]);

  if (!skillId) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Skill Details
            {skill && (
              <Link
                href={`/skills/${skill.id}`}
                className="text-sm font-normal text-blue-600 hover:underline flex items-center gap-1"
              >
                View Public Page
                <ExternalLink className="h-3 w-3" />
              </Link>
            )}
          </DialogTitle>
          <DialogDescription>View skill information and management options</DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : skill ? (
          <div className="space-y-6">
            {/* Basic Info */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{skill.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Category</p>
                    <CategoryBadge category={skill.category as 'DEVELOPMENT' | 'SECURITY' | 'DATA_ANALYTICS' | 'AI_ML' | 'TESTING' | 'INTEGRATION'} />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Visibility</p>
                    <VisibilityBadge visibility={skill.visibility as 'PUBLIC' | 'TEAM_ONLY' | 'PRIVATE'} />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Downloads</p>
                    <p className="font-medium flex items-center gap-1">
                      <Download className="h-4 w-4" />
                      {skill.stats?.downloadsCount ?? 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Views</p>
                    <p className="font-medium flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      {skill.stats?.viewsCount ?? 0}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Author</p>
                    <p className="font-medium">{skill.author.name || skill.author.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Team</p>
                    <p className="font-medium">
                      {skill.team ? (
                        <Link href={`/teams/${skill.team.slug}`} className="hover:underline">
                          {skill.team.name}
                        </Link>
                      ) : (
                        'None'
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Created</p>
                    <p className="font-medium">{new Date(skill.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Updated</p>
                    <p className="font-medium">{new Date(skill.updatedAt).toLocaleDateString()}</p>
                  </div>
                </div>

                {skill.description && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Description</p>
                    <p className="text-sm">{skill.description}</p>
                  </div>
                )}

                {skill.tags.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm text-muted-foreground mb-2">Tags</p>
                    <div className="flex flex-wrap gap-2">
                      {skill.tags.map((tag) => (
                        <Badge key={tag} variant="outline">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tabs */}
            <Tabs defaultValue="versions">
              <TabsList>
                <TabsTrigger value="versions">Versions ({skill.versions.length})</TabsTrigger>
                <TabsTrigger value="feedback">Feedback ({skill.feedback.length})</TabsTrigger>
                <TabsTrigger value="downloads">Recent Downloads</TabsTrigger>
              </TabsList>

              <TabsContent value="versions" className="mt-4 space-y-4">
                {skill.versions.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No versions yet</p>
                ) : (
                  skill.versions.map((version) => (
                    <Card key={version.id}>
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">v{version.version}</CardTitle>
                          <StatusBadge status={version.status as 'PENDING' | 'VALIDATING' | 'EVALUATING' | 'SCANNING' | 'APPROVED' | 'REJECTED'} />
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Created by {version.creator.name || version.creator.email} on{' '}
                          {new Date(version.createdAt).toLocaleDateString()}
                        </p>
                      </CardHeader>
                      <CardContent>
                        {/* Security Scans */}
                        {version.scans.length > 0 && (
                          <div className="mb-4">
                            <p className="text-sm font-medium mb-2">Security Scans</p>
                            {version.scans.map((scan) => (
                              <div key={scan.id} className="flex items-center gap-2 text-sm">
                                {scan.score !== null && (
                                  <Badge variant="outline">Score: {scan.score}</Badge>
                                )}
                                {scan.riskLevel && (
                                  <Badge className={RISK_COLORS[scan.riskLevel] || ''}>
                                    {scan.riskLevel} risk
                                  </Badge>
                                )}
                                {scan.blockExecution && (
                                  <Badge variant="destructive" className="flex items-center gap-1">
                                    <AlertCircle className="h-3 w-3" />
                                    Blocked
                                  </Badge>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Eval Results */}
                        {version.evals.length > 0 && (
                          <div>
                            <p className="text-sm font-medium mb-2">Evaluation Results</p>
                            {version.evals.map((eval_) => (
                              <div key={eval_.id} className="text-sm">
                                <p className="text-muted-foreground mb-1">
                                  Status: <Badge variant="outline">{eval_.status}</Badge>
                                </p>
                                {eval_.results.length > 0 && (
                                  <div className="grid gap-1">
                                    {eval_.results.map((result, i) => (
                                      <div key={i} className="flex items-center gap-2">
                                        <Badge
                                          variant={
                                            result.status === 'PASSED'
                                              ? 'default'
                                              : result.status === 'FAILED'
                                                ? 'destructive'
                                                : 'secondary'
                                          }
                                        >
                                          {result.testName}
                                        </Badge>
                                        <span className="text-muted-foreground">{result.status}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>

              <TabsContent value="feedback" className="mt-4">
                {skill.feedback.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No feedback yet</p>
                ) : (
                  <div className="space-y-3">
                    {skill.feedback.map((fb) => (
                      <div key={fb.id} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {fb.user.name || fb.user.email}
                            </span>
                            <Badge variant="outline">{fb.rating}/5</Badge>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {new Date(fb.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        {fb.comment && <p className="text-sm">{fb.comment}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="downloads" className="mt-4">
                {skill.downloads.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No downloads yet</p>
                ) : (
                  <div className="space-y-2">
                    {skill.downloads.slice(0, 20).map((dl, i) => (
                      <div key={i} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center gap-2">
                          <Download className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{dl.downloadType}</span>
                          {dl.version && (
                            <Badge variant="outline" className="text-xs">
                              v{dl.version}
                            </Badge>
                          )}
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {new Date(dl.createdAt).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <p className="text-muted-foreground">Skill not found</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
