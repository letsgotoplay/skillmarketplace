'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { SecurityFindings } from '@/components/security/security-findings';
import { RefreshCw, ExternalLink } from 'lucide-react';
import type { SecurityFinding } from '@/lib/security/scanner';

interface SecuritySkillCardProps {
  skillId: string;
  skillVersionId: string;
  skillName: string;
  version: string;
  createdAt: Date;
  scan: {
    id: string;
    status: string;
  } | null;
  aiSecurityAnalyzed: boolean | null;
  reportJson: {
    riskLevel?: 'low' | 'medium' | 'high' | 'critical';
    findings?: SecurityFinding[];
    summary?: {
      critical: number;
      high: number;
      medium: number;
      low: number;
      info: number;
      total: number;
    };
    analyzedAt?: string;
    analyzedFiles?: number;
  } | null;
  aiReport: {
    riskLevel?: string;
    threats?: SecurityFinding[];
    recommendations?: string[];
    confidence?: number;
  } | null;
  combinedRiskLevel: 'low' | 'medium' | 'high' | 'critical' | 'unknown';
  combinedSummary: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
    total: number;
  };
  allFindings: SecurityFinding[];
}

export function SecuritySkillCard({
  skillId,
  skillName,
  version,
  createdAt,
  scan,
  aiSecurityAnalyzed,
  reportJson,
  aiReport,
  combinedRiskLevel,
  combinedSummary,
  allFindings,
}: SecuritySkillCardProps) {
  const router = useRouter();
  const [isReanalyzing, setIsReanalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleReanalyze = async () => {
    setIsReanalyzing(true);
    setError(null);

    try {
      const response = await fetch(`/api/skills/${skillId}/reanalyze`, {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to re-analyze');
      }

      // Refresh the page to show updated results
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to re-analyze');
    } finally {
      setIsReanalyzing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {skillName}
              <Link href={`/dashboard/skills/${skillId}`}>
                <ExternalLink className="h-4 w-4 text-muted-foreground hover:text-foreground" />
              </Link>
            </CardTitle>
            <CardDescription>
              Version {version} • Uploaded {new Date(createdAt).toLocaleDateString()}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleReanalyze}
              disabled={isReanalyzing}
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${isReanalyzing ? 'animate-spin' : ''}`} />
              {isReanalyzing ? 'Analyzing...' : 'Re-analyze'}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}

        {!scan && !aiSecurityAnalyzed ? (
          <div className="text-center py-8 text-muted-foreground">
            <RefreshCw className="h-8 w-8 mx-auto mb-2 animate-spin" />
            <p>Security analysis in progress...</p>
          </div>
        ) : allFindings.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-green-600 font-medium">No security issues found</p>
          </div>
        ) : (
          <SecurityFindings
            riskLevel={combinedRiskLevel}
            findings={allFindings}
            summary={combinedSummary}
            analyzedAt={reportJson?.analyzedAt}
            analyzedFiles={reportJson?.analyzedFiles}
          />
        )}

        {/* AI Recommendations */}
        {aiReport?.recommendations && aiReport.recommendations.length > 0 && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-medium text-blue-800 mb-2">AI Recommendations</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              {aiReport.recommendations.map((rec, i) => (
                <li key={i}>• {rec}</li>
              ))}
            </ul>
            {aiReport.confidence && (
              <p className="text-xs text-blue-600 mt-2">
                AI Confidence: {aiReport.confidence}%
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
