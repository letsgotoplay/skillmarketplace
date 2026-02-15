'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Loader2, RefreshCw, ShieldX, ShieldAlert, ShieldQuestion, ShieldCheck, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface Team {
  id: string;
  name: string;
}

interface Bundle {
  id: string;
  name: string;
}

interface Skill {
  id: string;
  name: string;
  description: string | null;
}

interface ReanalysisResult {
  skillId: string;
  skillVersionId: string;
  skillName: string;
  status: 'success' | 'failed';
  riskLevel?: string;
  error?: string;
}

interface ReanalysisResponse {
  success: boolean;
  message: string;
  totalSkills: number;
  processedCount: number;
  failedCount: number;
  limited?: boolean;
  results: ReanalysisResult[];
}

// Risk level configuration
const riskLevelConfig: Record<string, { label: string; color: string; bgColor: string; borderColor: string; icon: React.ReactNode }> = {
  critical: {
    label: 'Critical',
    color: 'text-red-700',
    bgColor: 'bg-red-100',
    borderColor: 'border-red-300',
    icon: <ShieldX className="h-5 w-5 text-red-600" />,
  },
  high: {
    label: 'High',
    color: 'text-orange-700',
    bgColor: 'bg-orange-100',
    borderColor: 'border-orange-300',
    icon: <ShieldAlert className="h-5 w-5 text-orange-600" />,
  },
  medium: {
    label: 'Medium',
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-100',
    borderColor: 'border-yellow-300',
    icon: <ShieldQuestion className="h-5 w-5 text-yellow-600" />,
  },
  low: {
    label: 'Low',
    color: 'text-green-700',
    bgColor: 'bg-green-100',
    borderColor: 'border-green-300',
    icon: <ShieldCheck className="h-5 w-5 text-green-600" />,
  },
};

// Result Card Component
function ReanalysisResultCard({ result }: { result: ReanalysisResult }) {
  const config = result.riskLevel ? riskLevelConfig[result.riskLevel] : null;

  if (result.status === 'failed') {
    return (
      <div className="p-4 rounded-lg border border-red-200 bg-red-50">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <ShieldX className="h-5 w-5 text-red-600" />
            <div>
              <p className="font-medium text-red-800">{result.skillName}</p>
              <p className="text-sm text-red-600">{result.error || 'Analysis failed'}</p>
            </div>
          </div>
          <Badge variant="destructive">Failed</Badge>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('rounded-lg border overflow-hidden', config?.borderColor || 'border-gray-200')}>
      {/* Header */}
      <div className={cn('p-4 flex items-center justify-between', config?.bgColor || 'bg-gray-50')}>
        <div className="flex items-center gap-3">
          {config?.icon || <ShieldCheck className="h-5 w-5 text-gray-500" />}
          <div>
            <div className="flex items-center gap-2">
              <p className="font-medium">{result.skillName}</p>
              <Link
                href={`/dashboard/skills/${result.skillId}`}
                className="text-muted-foreground hover:text-foreground"
                target="_blank"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            </div>
            <p className="text-sm text-muted-foreground">
              {config?.label || 'Unknown'} Risk
            </p>
          </div>
        </div>
        <Badge
          variant={
            result.riskLevel === 'critical' ? 'destructive' :
            result.riskLevel === 'high' ? 'default' :
            result.riskLevel === 'medium' ? 'secondary' : 'outline'
          }
        >
          {result.riskLevel || 'Unknown'}
        </Badge>
      </div>
    </div>
  );
}

export default function SecurityReanalysisPage() {
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ReanalysisResponse | null>(null);

  // Scope selection
  const [scopeType, setScopeType] = useState<'all' | 'team' | 'bundle' | 'skills'>('all');
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [selectedBundle, setSelectedBundle] = useState<string>('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);

  // Data for dropdowns
  const [teams, setTeams] = useState<Team[]>([]);
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [allSkills, setAllSkills] = useState<Skill[]>([]);
  const [displayedSkills, setDisplayedSkills] = useState<Skill[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [previewCount, setPreviewCount] = useState<number>(0);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch teams, bundles, skills on mount
  useEffect(() => {
    async function fetchData() {
      setLoadingData(true);
      try {
        const [teamsRes, bundlesRes, skillsRes] = await Promise.all([
          fetch('/api/teams'),
          fetch('/api/bundles'),
          fetch('/api/skills?limit=100'),
        ]);

        if (teamsRes.ok) {
          const data = await teamsRes.json();
          setTeams(data.teams || []);
        }
        if (bundlesRes.ok) {
          const data = await bundlesRes.json();
          setBundles(data.bundles || []);
        }
        if (skillsRes.ok) {
          const data = await skillsRes.json();
          setAllSkills(data.skills || []);
          setDisplayedSkills(data.skills || []);
        }
      } catch (err) {
        console.error('Failed to fetch data:', err);
      } finally {
        setLoadingData(false);
      }
    }
    fetchData();
  }, []);

  // Debounced skill search
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

  // Fetch preview count when scope changes
  useEffect(() => {
    fetchPreviewCount();
  }, [scopeType, selectedTeam, selectedBundle, selectedSkills]);

  const fetchPreviewCount = async () => {
    try {
      const params = new URLSearchParams();
      params.set('type', scopeType);
      if (scopeType === 'team' && selectedTeam) {
        params.set('teamId', selectedTeam);
      }
      if (scopeType === 'bundle' && selectedBundle) {
        params.set('bundleId', selectedBundle);
      }
      if (scopeType === 'skills' && selectedSkills.length > 0) {
        params.set('skillIds', selectedSkills.join(','));
      }

      const response = await fetch(`/api/admin/security-reanalysis?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setPreviewCount(data.count);
      }
    } catch (err) {
      console.error('Failed to fetch preview count:', err);
    }
  };

  const handleToggleSkill = (skillId: string, checked: boolean) => {
    setSelectedSkills((prev) =>
      checked ? [...prev, skillId] : prev.filter((id) => id !== skillId)
    );
  };

  const handleReanalyze = async () => {
    setAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      const body: {
        scope: {
          type: 'all' | 'team' | 'bundle' | 'skills';
          teamId?: string;
          bundleId?: string;
          skillIds?: string[];
        };
      } = {
        scope: { type: scopeType },
      };

      if (scopeType === 'team') {
        body.scope.teamId = selectedTeam;
      }
      if (scopeType === 'bundle') {
        body.scope.bundleId = selectedBundle;
      }
      if (scopeType === 'skills') {
        body.scope.skillIds = selectedSkills;
      }

      const response = await fetch('/api/admin/security-reanalysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data: ReanalysisResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to trigger re-analysis');
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to trigger re-analysis');
    } finally {
      setAnalyzing(false);
    }
  };

  if (loadingData) {
    return (
      <div className="container mx-auto py-8 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-2">
          <Link href="/dashboard/admin/security">
            <Button variant="ghost" size="sm">
              ← Back to Security Config
            </Button>
          </Link>
        </div>
        <h1 className="text-3xl font-bold">Security Re-Analysis</h1>
        <p className="text-muted-foreground">
          Re-analyze existing skills with updated security configuration
        </p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-destructive/10 text-destructive rounded-md">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2 items-start">
        {/* Scope Selection */}
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>Select Scope</CardTitle>
            <CardDescription>
              Choose which skills to re-analyze
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <RadioGroup
              value={scopeType}
              onValueChange={(value) => setScopeType(value as typeof scopeType)}
              className="space-y-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="all" id="all" />
                <Label htmlFor="all">All Skills</Label>
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="team" id="team" />
                  <Label htmlFor="team">By Team</Label>
                </div>
                {scopeType === 'team' && (
                  <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                    <SelectTrigger className="ml-6">
                      <SelectValue placeholder="Select a team..." />
                    </SelectTrigger>
                    <SelectContent>
                      {teams.length === 0 ? (
                        <SelectItem value="_none" disabled>No teams available</SelectItem>
                      ) : (
                        teams.map((team) => (
                          <SelectItem key={team.id} value={team.id}>
                            {team.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="bundle" id="bundle" />
                  <Label htmlFor="bundle">By Bundle</Label>
                </div>
                {scopeType === 'bundle' && (
                  <Select value={selectedBundle} onValueChange={setSelectedBundle}>
                    <SelectTrigger className="ml-6">
                      <SelectValue placeholder="Select a bundle..." />
                    </SelectTrigger>
                    <SelectContent>
                      {bundles.length === 0 ? (
                        <SelectItem value="_none" disabled>No bundles available</SelectItem>
                      ) : (
                        bundles.map((bundle) => (
                          <SelectItem key={bundle.id} value={bundle.id}>
                            {bundle.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="skills" id="skills" />
                  <Label htmlFor="skills">Specific Skills ({selectedSkills.length} selected)</Label>
                </div>
                {scopeType === 'skills' && (
                  <div className="ml-6 space-y-2">
                    {/* Search Input */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search skills..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                      />
                      {searching && (
                        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                      )}
                    </div>

                    {/* Skills List with Checkboxes */}
                    <div className="border rounded-lg max-h-48 overflow-y-auto">
                      {displayedSkills.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          {searchQuery ? 'No skills match your search.' : 'No skills available.'}
                        </p>
                      ) : (
                        <div className="divide-y">
                          {displayedSkills.map((skill) => {
                            const isSelected = selectedSkills.includes(skill.id);
                            return (
                              <div
                                key={skill.id}
                                className="flex items-center gap-2 p-2 hover:bg-muted/50"
                              >
                                <Checkbox
                                  id={`skill-${skill.id}`}
                                  checked={isSelected}
                                  onCheckedChange={(checked) =>
                                    handleToggleSkill(skill.id, checked as boolean)
                                  }
                                  className="shrink-0"
                                />
                                <label
                                  htmlFor={`skill-${skill.id}`}
                                  className="flex-1 cursor-pointer min-w-0 overflow-hidden"
                                >
                                  <span className="text-sm font-medium block truncate">{skill.name}</span>
                                  {skill.description && (
                                    <span className="text-xs text-muted-foreground block truncate">
                                      {skill.description.length > 60
                                        ? `${skill.description.substring(0, 60)}...`
                                        : skill.description}
                                    </span>
                                  )}
                                </label>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </RadioGroup>

            {/* Preview Count */}
            <div className="p-4 bg-muted rounded-md">
              <div className="flex items-center justify-between">
                <span className="font-medium">Skills to analyze:</span>
                <Badge variant="outline">{previewCount}</Badge>
              </div>
              {previewCount > 50 && (
                <p className="text-sm text-muted-foreground mt-2">
                  Note: Only the first 50 skills will be processed at once
                </p>
              )}
            </div>

            <Button
              onClick={handleReanalyze}
              disabled={analyzing || previewCount === 0 || (scopeType === 'team' && !selectedTeam) || (scopeType === 'bundle' && !selectedBundle) || (scopeType === 'skills' && selectedSkills.length === 0)}
              className="w-full"
            >
              {analyzing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Start Re-Analysis
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Results */}
        <Card>
          <CardHeader>
            <CardTitle>Results</CardTitle>
            <CardDescription>
              {result
                ? `Processed ${result.processedCount} of ${result.totalSkills} skills`
                : 'Results will appear here after analysis'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!result ? (
              <div className="text-center text-muted-foreground py-12">
                <RefreshCw className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No results yet.</p>
                <p className="text-sm">Select a scope and start the analysis.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Summary */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-3xl font-bold">{result.totalSkills}</div>
                    <div className="text-sm text-muted-foreground">Total</div>
                  </div>
                  <div className="text-center p-4 bg-green-100 rounded-lg">
                    <div className="text-3xl font-bold text-green-700">{result.processedCount}</div>
                    <div className="text-sm text-green-600">Success</div>
                  </div>
                  <div className="text-center p-4 bg-red-100 rounded-lg">
                    <div className="text-3xl font-bold text-red-700">{result.failedCount}</div>
                    <div className="text-sm text-red-600">Failed</div>
                  </div>
                </div>

                {result.limited && (
                  <Badge variant="secondary" className="w-full justify-center py-2">
                    Limited to first 50 skills
                  </Badge>
                )}

                {/* Results List */}
                {result.results.length > 0 && (
                  <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                    {result.results.map((r) => (
                      <ReanalysisResultCard key={r.skillVersionId} result={r} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
