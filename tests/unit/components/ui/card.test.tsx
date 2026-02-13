import React from 'react';
import { render, screen } from '@testing-library/react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';

describe('Card Components', () => {
  describe('Card', () => {
    it('renders children correctly', () => {
      render(
        <Card data-testid="card">
          <p>Card content</p>
        </Card>
      );
      expect(screen.getByTestId('card')).toBeInTheDocument();
      expect(screen.getByText('Card content')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(<Card className="custom-card" data-testid="card" />);
      expect(screen.getByTestId('card')).toHaveClass('custom-card');
    });

    it('has default card styling', () => {
      render(<Card data-testid="card" />);
      const card = screen.getByTestId('card');
      expect(card).toHaveClass('rounded-lg');
      expect(card).toHaveClass('border');
      expect(card).toHaveClass('bg-card');
    });
  });

  describe('CardHeader', () => {
    it('renders children correctly', () => {
      render(
        <CardHeader data-testid="header">
          <span>Header content</span>
        </CardHeader>
      );
      expect(screen.getByTestId('header')).toBeInTheDocument();
      expect(screen.getByText('Header content')).toBeInTheDocument();
    });

    it('has correct default classes', () => {
      render(<CardHeader data-testid="header" />);
      expect(screen.getByTestId('header')).toHaveClass('flex', 'flex-col', 'p-6');
    });
  });

  describe('CardTitle', () => {
    it('renders as h3 element', () => {
      render(<CardTitle>Title</CardTitle>);
      const title = screen.getByRole('heading', { level: 3 });
      expect(title).toBeInTheDocument();
      expect(title).toHaveTextContent('Title');
    });

    it('applies custom className', () => {
      render(<CardTitle className="custom-title">Title</CardTitle>);
      expect(screen.getByRole('heading')).toHaveClass('custom-title');
    });
  });

  describe('CardDescription', () => {
    it('renders description text', () => {
      render(<CardDescription>Description text</CardDescription>);
      expect(screen.getByText('Description text')).toBeInTheDocument();
    });

    it('has muted foreground color', () => {
      render(<CardDescription>Description</CardDescription>);
      expect(screen.getByText('Description')).toHaveClass('text-muted-foreground');
    });
  });

  describe('CardContent', () => {
    it('renders children correctly', () => {
      render(
        <CardContent data-testid="content">
          <p>Content area</p>
        </CardContent>
      );
      expect(screen.getByTestId('content')).toBeInTheDocument();
      expect(screen.getByText('Content area')).toBeInTheDocument();
    });

    it('has correct padding', () => {
      render(<CardContent data-testid="content" />);
      expect(screen.getByTestId('content')).toHaveClass('p-6');
    });
  });

  describe('CardFooter', () => {
    it('renders children correctly', () => {
      render(
        <CardFooter data-testid="footer">
          <button>Action</button>
        </CardFooter>
      );
      expect(screen.getByTestId('footer')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument();
    });

    it('has flex layout', () => {
      render(<CardFooter data-testid="footer" />);
      expect(screen.getByTestId('footer')).toHaveClass('flex', 'items-center');
    });
  });

  describe('Full Card Composition', () => {
    it('renders a complete card with all parts', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Test Card</CardTitle>
            <CardDescription>A test card description</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Main content of the card</p>
          </CardContent>
          <CardFooter>
            <button>Submit</button>
          </CardFooter>
        </Card>
      );

      expect(screen.getByRole('heading', { name: 'Test Card' })).toBeInTheDocument();
      expect(screen.getByText('A test card description')).toBeInTheDocument();
      expect(screen.getByText('Main content of the card')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Submit' })).toBeInTheDocument();
    });
  });
});
