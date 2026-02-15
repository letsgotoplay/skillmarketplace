'use client';

import { Badge } from '@/components/ui/badge';

type SkillStatus = 'PENDING' | 'VALIDATING' | 'EVALUATING' | 'SCANNING' | 'APPROVED' | 'REJECTED';
type SkillVisibility = 'PUBLIC' | 'TEAM_ONLY' | 'PRIVATE';
type SkillCategory = 'DEVELOPMENT' | 'SECURITY' | 'DATA_ANALYTICS' | 'AI_ML' | 'TESTING' | 'INTEGRATION';

const STATUS_CONFIG: Record<SkillStatus, { label: string; color: string }> = {
  APPROVED: { label: 'Approved', color: 'bg-green-100 text-green-800' },
  REJECTED: { label: 'Rejected', color: 'bg-red-100 text-red-800' },
  PENDING: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
  VALIDATING: { label: 'Validating', color: 'bg-blue-100 text-blue-800' },
  EVALUATING: { label: 'Evaluating', color: 'bg-purple-100 text-purple-800' },
  SCANNING: { label: 'Scanning', color: 'bg-orange-100 text-orange-800' },
};

const VISIBILITY_CONFIG: Record<SkillVisibility, { label: string; color: string }> = {
  PUBLIC: { label: 'Public', color: 'bg-green-100 text-green-800' },
  TEAM_ONLY: { label: 'Team Only', color: 'bg-yellow-100 text-yellow-800' },
  PRIVATE: { label: 'Private', color: 'bg-gray-100 text-gray-800' },
};

const CATEGORY_CONFIG: Record<SkillCategory, { label: string; color: string }> = {
  DEVELOPMENT: { label: 'Development', color: 'bg-blue-100 text-blue-800' },
  SECURITY: { label: 'Security', color: 'bg-red-100 text-red-800' },
  DATA_ANALYTICS: { label: 'Data Analytics', color: 'bg-purple-100 text-purple-800' },
  AI_ML: { label: 'AI/ML', color: 'bg-indigo-100 text-indigo-800' },
  TESTING: { label: 'Testing', color: 'bg-green-100 text-green-800' },
  INTEGRATION: { label: 'Integration', color: 'bg-orange-100 text-orange-800' },
};

interface StatusBadgeProps {
  status: SkillStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] || { label: status, color: 'bg-gray-100 text-gray-800' };
  return (
    <Badge className={config.color} variant="secondary">
      {config.label}
    </Badge>
  );
}

interface VisibilityBadgeProps {
  visibility: SkillVisibility;
}

export function VisibilityBadge({ visibility }: VisibilityBadgeProps) {
  const config = VISIBILITY_CONFIG[visibility] || { label: visibility, color: 'bg-gray-100 text-gray-800' };
  return (
    <Badge className={config.color} variant="secondary">
      {config.label}
    </Badge>
  );
}

interface CategoryBadgeProps {
  category: SkillCategory;
}

export function CategoryBadge({ category }: CategoryBadgeProps) {
  const config = CATEGORY_CONFIG[category] || { label: category, color: 'bg-gray-100 text-gray-800' };
  return (
    <Badge className={config.color} variant="secondary">
      {config.label}
    </Badge>
  );
}
