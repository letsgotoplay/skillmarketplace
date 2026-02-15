'use client';

import { SearchInput } from '@/components/admin/filters/search-input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface SkillFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  category: string;
  onCategoryChange: (value: string) => void;
  visibility: string;
  onVisibilityChange: (value: string) => void;
}

const CATEGORIES = [
  { value: 'ALL', label: 'All Categories' },
  { value: 'DEVELOPMENT', label: 'Development' },
  { value: 'SECURITY', label: 'Security' },
  { value: 'DATA_ANALYTICS', label: 'Data Analytics' },
  { value: 'AI_ML', label: 'AI/ML' },
  { value: 'TESTING', label: 'Testing' },
  { value: 'INTEGRATION', label: 'Integration' },
];

const VISIBILITY_OPTIONS = [
  { value: 'ALL', label: 'All Visibility' },
  { value: 'PUBLIC', label: 'Public' },
  { value: 'TEAM_ONLY', label: 'Team Only' },
  { value: 'PRIVATE', label: 'Private' },
];

export function SkillFilters({
  search,
  onSearchChange,
  category,
  onCategoryChange,
  visibility,
  onVisibilityChange,
}: SkillFiltersProps) {
  return (
    <div className="flex flex-wrap gap-4">
      <SearchInput
        value={search}
        onChange={onSearchChange}
        placeholder="Search skills..."
        className="w-[300px]"
      />
      <Select value={category} onValueChange={onCategoryChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Category" />
        </SelectTrigger>
        <SelectContent>
          {CATEGORIES.map((cat) => (
            <SelectItem key={cat.value} value={cat.value}>
              {cat.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={visibility} onValueChange={onVisibilityChange}>
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="Visibility" />
        </SelectTrigger>
        <SelectContent>
          {VISIBILITY_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
