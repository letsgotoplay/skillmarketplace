export function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  return (
    <div
      className={`animate-spin rounded-full border-2 border-muted border-t-primary ${sizeClasses[size]}`}
    />
  );
}

export function LoadingPage() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <LoadingSpinner size="lg" />
    </div>
  );
}

export function LoadingOverlay() {
  return (
    <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-50">
      <LoadingSpinner size="lg" />
    </div>
  );
}

export function ButtonLoading({ children }: { children: React.ReactNode }) {
  return (
    <span className="flex items-center gap-2">
      <LoadingSpinner size="sm" />
      {children}
    </span>
  );
}
