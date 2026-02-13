'use client';

import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: { componentStack: string }) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  override render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
          <h2 className="text-2xl font-bold mb-4">Something went wrong</h2>
          <p className="text-muted-foreground mb-4">
            An error occurred while rendering this component.
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: undefined })}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export function ErrorMessage({
  title = 'Error',
  message,
  onRetry,
}: {
  title?: string;
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[200px] p-8 border rounded-lg bg-destructive/10">
      <h3 className="text-lg font-semibold text-destructive mb-2">{title}</h3>
      <p className="text-muted-foreground text-center mb-4">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          Try again
        </button>
      )}
    </div>
  );
}

export function NotFound({
  title = 'Not Found',
  message = "The page or resource you're looking for doesn't exist.",
}: {
  title?: string;
  message?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
      <h2 className="text-2xl font-bold mb-4">{title}</h2>
      <p className="text-muted-foreground text-center mb-4">{message}</p>
      <a
        href="/"
        className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
      >
        Go Home
      </a>
    </div>
  );
}
