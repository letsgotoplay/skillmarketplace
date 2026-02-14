'use client';

import * as React from 'react';
import { useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  AlertCircle,
  Info,
  ShieldAlert,
  ShieldCheck,
  ShieldQuestion,
  ShieldX,
  Code,
  FileText,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SecurityFinding, SeverityLevel } from '@/lib/security/scanner';

const severityColors: Record<SeverityLevel, { bg: string; text: string; border: string }> = {
  critical: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  high: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  medium: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' },
  low: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  info: { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' },
};

const severityIcons: Record<SeverityLevel, React.ReactNode> = {
  critical: <ShieldX className="h-5 w-5 text-red-600" />,
  high: <ShieldAlert className="h-5 w-5 text-orange-600" />,
  medium: <AlertTriangle className="h-5 w-5 text-yellow-600" />,
  low: <AlertCircle className="h-5 w-5 text-blue-600" />,
  info: <Info className="h-5 w-5 text-gray-600" />,
};

const riskLevelConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  critical: {
    label: 'Critical Risk',
    color: 'bg-red-100 text-red-800 border-red-300',
    icon: <ShieldX className="h-6 w-6 text-red-600" />,
  },
  high: {
    label: 'High Risk',
    color: 'bg-orange-100 text-orange-800 border-orange-300',
    icon: <ShieldAlert className="h-6 w-6 text-orange-600" />,
  },
  medium: {
    label: 'Medium Risk',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    icon: <ShieldQuestion className="h-6 w-6 text-yellow-600" />,
  },
  low: {
    label: 'Low Risk',
    color: 'bg-green-100 text-green-800 border-green-300',
    icon: <ShieldCheck className="h-6 w-6 text-green-600" />,
  },
  unknown: {
    label: 'Unknown',
    color: 'bg-gray-100 text-gray-800 border-gray-300',
    icon: <ShieldQuestion className="h-6 w-6 text-gray-600" />,
  },
};

interface FindingCardProps {
  finding: SecurityFinding;
  defaultExpanded?: boolean;
}

function FindingCard({ finding, defaultExpanded = false }: FindingCardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const colors = severityColors[finding.severity];

  return (
    <div className={cn('rounded-lg border', colors.border, colors.bg)}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-3 flex items-start gap-3 text-left"
      >
        <div className="mt-0.5">{severityIcons[finding.severity]}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={cn('font-semibold', colors.text)}>{finding.title}</span>
            <span className={cn('text-xs px-2 py-0.5 rounded-full', colors.bg, colors.text, 'border', colors.border)}>
              {finding.severity.toUpperCase()}
            </span>
          </div>
          <p className="text-sm text-gray-600 mt-1 line-clamp-2">{finding.description}</p>
          {finding.file && (
            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
              <FileText className="h-3 w-3" />
              {finding.file}
              {finding.line && `:${finding.line}`}
            </p>
          )}
        </div>
        {expanded ? (
          <ChevronDown className="h-5 w-5 text-gray-400 flex-shrink-0" />
        ) : (
          <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0" />
        )}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3">
          {/* Code Snippet */}
          {finding.codeSnippet && (
            <div>
              <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                <Code className="h-3 w-3" />
                Code Context
              </div>
              <pre className="text-xs bg-gray-900 text-gray-100 p-3 rounded-md overflow-x-auto font-mono">
                {finding.codeSnippet}
              </pre>
            </div>
          )}

          {/* Category */}
          <div className="text-sm">
            <span className="text-gray-500">Category: </span>
            <span className="font-medium text-gray-700">{finding.category}</span>
          </div>

          {/* Recommendation */}
          <div className="text-sm">
            <span className="text-gray-500">Recommendation: </span>
            <span className="text-gray-700">{finding.recommendation}</span>
          </div>

          {/* Source */}
          <div className="text-xs text-gray-400">
            Source: {finding.source === 'pattern' ? 'Pattern Scanner' : 'AI Analysis'}
          </div>
        </div>
      )}
    </div>
  );
}

interface SecurityFindingsProps {
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
  analyzedAt?: string;
  analyzedFiles?: number;
}

export function SecurityFindings({
  riskLevel,
  findings,
  summary,
  analyzedAt,
  analyzedFiles,
}: SecurityFindingsProps) {
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
    <div className="space-y-4">
      {/* Risk Level Banner */}
      <div className={cn('rounded-lg border p-4 flex items-center gap-3', config.color)}>
        {config.icon}
        <div>
          <h3 className="font-semibold text-lg">{config.label}</h3>
          {summary && (
            <p className="text-sm opacity-80">
              {summary.total} finding{summary.total !== 1 ? 's' : ''} found
            </p>
          )}
        </div>
      </div>

      {/* Summary Stats */}
      {summary && (
        <div className="grid grid-cols-5 gap-2">
          {(['critical', 'high', 'medium', 'low', 'info'] as SeverityLevel[]).map((severity) => (
            <button
              key={severity}
              onClick={() => setFilter(filter === severity ? 'all' : severity)}
              className={cn(
                'p-2 rounded-lg border text-center transition-colors',
                severityColors[severity].bg,
                severityColors[severity].border,
                filter === severity && 'ring-2 ring-offset-1 ring-gray-400'
              )}
            >
              <div className={cn('text-xl font-bold', severityColors[severity].text)}>
                {summary[severity]}
              </div>
              <div className={cn('text-xs capitalize', severityColors[severity].text)}>
                {severity}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Filter indicator */}
      {filter !== 'all' && (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span>Showing {filter} severity only</span>
          <button
            onClick={() => setFilter('all')}
            className="text-blue-600 hover:underline"
          >
            Show all
          </button>
        </div>
      )}

      {/* Analysis metadata */}
      {(analyzedAt || analyzedFiles !== undefined) && (
        <div className="text-xs text-gray-500 flex items-center gap-4">
          {analyzedFiles !== undefined && (
            <span>{analyzedFiles} files analyzed</span>
          )}
          {analyzedAt && (
            <span>Analyzed: {new Date(analyzedAt).toLocaleString()}</span>
          )}
        </div>
      )}

      {/* Findings List */}
      <div className="space-y-2">
        {sortedFindings.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <ShieldCheck className="h-12 w-12 mx-auto mb-2 text-green-500" />
            <p>No security issues found</p>
          </div>
        ) : (
          sortedFindings.map((finding) => (
            <FindingCard
              key={finding.id}
              finding={finding}
              defaultExpanded={finding.severity === 'critical' || finding.severity === 'high'}
            />
          ))
        )}
      </div>
    </div>
  );
}
