'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight, ShieldX, ShieldAlert, ShieldQuestion, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SecurityFinding, SeverityLevel } from '@/lib/security/scanner';

const severityColors: Record<SeverityLevel, { bg: string; text: string; border: string; dot: string }> = {
  critical: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', dot: 'bg-red-500' },
  high: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', dot: 'bg-orange-500' },
  medium: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200', dot: 'bg-yellow-500' },
  low: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', dot: 'bg-blue-500' },
  info: { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200', dot: 'bg-gray-500' },
};

const riskLevelConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  critical: {
    label: 'Critical',
    color: 'bg-red-100 text-red-800 border-red-300',
    icon: <ShieldX className="h-5 w-5 text-red-600" />,
  },
  high: {
    label: 'High',
    color: 'bg-orange-100 text-orange-800 border-orange-300',
    icon: <ShieldAlert className="h-5 w-5 text-orange-600" />,
  },
  medium: {
    label: 'Medium',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    icon: <ShieldQuestion className="h-5 w-5 text-yellow-600" />,
  },
  low: {
    label: 'Low',
    color: 'bg-green-100 text-green-800 border-green-300',
    icon: <ShieldCheck className="h-5 w-5 text-green-600" />,
  },
  unknown: {
    label: 'Unknown',
    color: 'bg-gray-100 text-gray-800 border-gray-300',
    icon: <ShieldQuestion className="h-5 w-5 text-gray-600" />,
  },
};

interface MarketplaceSecuritySectionProps {
  riskLevel: 'low' | 'medium' | 'high' | 'critical' | 'unknown';
  findings: SecurityFinding[];
  summary?: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
    total: number;
  };
  aiConfidence?: number;
  analyzedAt?: string;
}

export function MarketplaceSecuritySection({
  riskLevel,
  findings,
  summary,
  aiConfidence,
  analyzedAt,
}: MarketplaceSecuritySectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [filter, setFilter] = useState<SeverityLevel | 'all'>('all');

  const config = riskLevelConfig[riskLevel] || riskLevelConfig.unknown;

  const filteredFindings = filter === 'all'
    ? findings
    : findings.filter((f) => f.severity === filter);

  // Sort by severity
  const severityOrder: SeverityLevel[] = ['critical', 'high', 'medium', 'low', 'info'];
  const sortedFindings = [...filteredFindings].sort(
    (a, b) => severityOrder.indexOf(a.severity) - severityOrder.indexOf(b.severity)
  );

  return (
    <div className="space-y-3">
      {/* Risk Level Badge */}
      <div className={cn('rounded-lg border p-3 flex items-center gap-2', config.color)}>
        {config.icon}
        <span className="font-medium">{config.label} Risk</span>
        {summary && (
          <Badge variant="outline" className="ml-auto">
            {summary.total} issue{summary.total !== 1 ? 's' : ''}
          </Badge>
        )}
      </div>

      {/* Summary Stats */}
      {summary && (
        <div className="grid grid-cols-5 gap-1">
          {(['critical', 'high', 'medium', 'low', 'info'] as SeverityLevel[]).map((severity) => (
            <button
              key={severity}
              onClick={() => setFilter(filter === severity ? 'all' : severity)}
              className={cn(
                'p-1.5 rounded border text-center transition-colors text-xs',
                severityColors[severity].bg,
                severityColors[severity].border,
                filter === severity && 'ring-2 ring-offset-1 ring-gray-400'
              )}
            >
              <div className={cn('font-bold', severityColors[severity].text)}>
                {summary[severity]}
              </div>
              <div className={cn('capitalize', severityColors[severity].text)}>
                {severity}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Filter indicator */}
      {filter !== 'all' && (
        <button
          onClick={() => setFilter('all')}
          className="text-xs text-blue-600 hover:underline"
        >
          Clear filter (showing {filter} only)
        </button>
      )}

      {/* Expandable Findings */}
      {findings.length > 0 && (
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <CollapsibleTrigger className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground w-full">
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
            {isExpanded ? 'Hide' : 'View'} detailed findings
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-3 space-y-2">
            {sortedFindings.map((finding) => (
              <div
                key={finding.id}
                className={cn('p-3 rounded-lg border', severityColors[finding.severity].bg, severityColors[finding.severity].border)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={cn('font-medium text-sm', severityColors[finding.severity].text)}>
                        {finding.title}
                      </span>
                      <Badge variant="outline" className={cn('text-xs', severityColors[finding.severity].text)}>
                        {finding.severity}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-600 line-clamp-2">{finding.description}</p>
                    {finding.file && (
                      <p className="text-xs text-gray-500 mt-1">
                        {finding.file}{finding.line ? `:${finding.line}` : ''}
                      </p>
                    )}
                  </div>
                  <Badge variant="secondary" className="text-xs shrink-0">
                    {finding.source === 'pattern' ? 'Pattern' : 'AI'}
                  </Badge>
                </div>
              </div>
            ))}
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* Meta info */}
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        {analyzedAt && (
          <span>Analyzed: {new Date(analyzedAt).toLocaleDateString()}</span>
        )}
        {aiConfidence !== undefined && (
          <span>AI Confidence: {aiConfidence}%</span>
        )}
      </div>
    </div>
  );
}
