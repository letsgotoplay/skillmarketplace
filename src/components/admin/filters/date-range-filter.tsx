'use client';

import { Calendar } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface DateRangeFilterProps {
  startDate?: string;
  endDate?: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  preset?: string;
  onPresetChange?: (preset: string) => void;
  className?: string;
}

const DATE_PRESETS = [
  { value: 'all', label: 'All Time' },
  { value: 'today', label: 'Today' },
  { value: '7days', label: 'Last 7 Days' },
  { value: '30days', label: 'Last 30 Days' },
  { value: 'custom', label: 'Custom Range' },
];

export function DateRangeFilter({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  preset = 'all',
  onPresetChange,
  className,
}: DateRangeFilterProps) {
  const handlePresetChange = (value: string) => {
    onPresetChange?.(value);

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (value) {
      case 'today':
        onStartDateChange(today.toISOString().split('T')[0]);
        onEndDateChange(today.toISOString().split('T')[0]);
        break;
      case '7days':
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        onStartDateChange(sevenDaysAgo.toISOString().split('T')[0]);
        onEndDateChange(today.toISOString().split('T')[0]);
        break;
      case '30days':
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        onStartDateChange(thirtyDaysAgo.toISOString().split('T')[0]);
        onEndDateChange(today.toISOString().split('T')[0]);
        break;
      case 'all':
        onStartDateChange('');
        onEndDateChange('');
        break;
      case 'custom':
        // Don't change dates, let user select
        break;
    }
  };

  return (
    <div className={`flex flex-wrap items-end gap-2 ${className}`}>
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Quick Select</Label>
        <Select value={preset} onValueChange={handlePresetChange}>
          <SelectTrigger className="w-[140px]">
            <Calendar className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Select range" />
          </SelectTrigger>
          <SelectContent>
            {DATE_PRESETS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {preset === 'custom' && (
        <>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">From</Label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => onStartDateChange(e.target.value)}
              className="w-[150px]"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">To</Label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => onEndDateChange(e.target.value)}
              className="w-[150px]"
            />
          </div>
        </>
      )}
    </div>
  );
}
