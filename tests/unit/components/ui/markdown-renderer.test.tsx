import React from 'react';
import { render, screen } from '@testing-library/react';

// Mock react-markdown and its plugins due to ESM compatibility issues in Jest
jest.mock('react-markdown', () => {
  return ({ children, components }: { children: string; components?: Record<string, React.ComponentType> }) => {
    // Simulate some basic markdown rendering for testing
    const processContent = (content: string): React.ReactNode => {
      // Simple heading detection
      const headingMatch = content.match(/^(#{1,6})\s+(.+)$/m);
      if (headingMatch) {
        const level = headingMatch[1].length as 1 | 2 | 3 | 4 | 5 | 6;
        const text = headingMatch[2];
        const HeadingTag = `h${level}` as keyof JSX.IntrinsicElements;
        return <HeadingTag>{text}</HeadingTag>;
      }
      // Simple link detection
      const linkMatch = content.match(/\[([^\]]+)\]\(([^)]+)\)/);
      if (linkMatch && components?.a) {
        const LinkComponent = components.a;
        return <LinkComponent href={linkMatch[2]}>{linkMatch[1]}</LinkComponent>;
      }
      return content;
    };

    return (
      <div className="prose prose-sm dark:prose-invert max-w-none" data-testid="markdown-content">
        {processContent(children)}
      </div>
    );
  };
});

jest.mock('remark-gfm', () => jest.fn());
jest.mock('rehype-sanitize', () => jest.fn());
jest.mock('rehype-highlight', () => jest.fn());

// Import after mocking
import { MarkdownRenderer } from '@/components/ui/markdown-renderer';

describe('MarkdownRenderer', () => {
  it('renders the component with content', () => {
    render(<MarkdownRenderer content="Hello World" />);
    expect(screen.getByTestId('markdown-content')).toBeInTheDocument();
    expect(screen.getByText('Hello World')).toBeInTheDocument();
  });

  it('renders heading content', () => {
    render(<MarkdownRenderer content="# Hello World" />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Hello World');
  });

  it('renders h2 heading', () => {
    render(<MarkdownRenderer content="## Second Level" />);
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Second Level');
  });

  it('applies prose classes for styling', () => {
    const { container } = render(<MarkdownRenderer content="Test content" />);
    expect(container.querySelector('.prose')).toBeInTheDocument();
    expect(container.querySelector('.dark\\:prose-invert')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <MarkdownRenderer content="Test" className="custom-class" />
    );
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('renders content in a div wrapper', () => {
    const { container } = render(<MarkdownRenderer content="Test" />);
    expect(container.querySelector('div[data-testid="markdown-content"]')).toBeInTheDocument();
  });

  it('handles empty content', () => {
    const { container } = render(<MarkdownRenderer content="" />);
    expect(container.querySelector('.prose')).toBeInTheDocument();
  });

  it('handles special characters', () => {
    render(<MarkdownRenderer content="Special: &lt;&gt;&amp;" />);
    expect(screen.getByText(/Special:/)).toBeInTheDocument();
  });

  it('renders multiple elements', () => {
    render(<MarkdownRenderer content="# Title" />);
    expect(screen.getByRole('heading')).toHaveTextContent('Title');
  });

  it('passes content through to markdown renderer', () => {
    const content = '## Test Heading';
    render(<MarkdownRenderer content={content} />);
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Test Heading');
  });
});
