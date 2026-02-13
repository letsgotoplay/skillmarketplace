'use client';

import { Button } from '@/components/ui/button';
import { Share2 } from 'lucide-react';
import { useState } from 'react';

interface ShareButtonProps {
  url: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
}

export function ShareButton({ url, variant = 'outline', size = 'lg' }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button variant={variant} size={size} onClick={handleShare}>
      <Share2 className="h-4 w-4 mr-2" />
      {copied ? 'Copied!' : 'Share'}
    </Button>
  );
}
