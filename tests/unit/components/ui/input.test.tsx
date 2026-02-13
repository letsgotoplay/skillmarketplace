import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from '@/components/ui/input';

describe('Input Component', () => {
  it('renders with default props', () => {
    render(<Input placeholder="Enter text" />);
    const input = screen.getByPlaceholderText('Enter text');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('type', 'text');
  });

  it('accepts different input types', () => {
    const { rerender } = render(<Input type="text" placeholder="Text" />);
    expect(screen.getByPlaceholderText('Text')).toHaveAttribute('type', 'text');

    rerender(<Input type="password" placeholder="Password" />);
    expect(screen.getByPlaceholderText('Password')).toHaveAttribute('type', 'password');

    rerender(<Input type="email" placeholder="Email" />);
    expect(screen.getByPlaceholderText('Email')).toHaveAttribute('type', 'email');

    rerender(<Input type="number" placeholder="Number" />);
    expect(screen.getByPlaceholderText('Number')).toHaveAttribute('type', 'number');
  });

  it('handles value changes', async () => {
    const user = userEvent.setup();
    const handleChange = jest.fn();
    render(<Input onChange={handleChange} placeholder="Type here" />);

    const input = screen.getByPlaceholderText('Type here');
    await user.type(input, 'hello');

    expect(handleChange).toHaveBeenCalled();
    expect(input).toHaveValue('hello');
  });

  it('can be disabled', () => {
    render(<Input disabled placeholder="Disabled input" />);
    expect(screen.getByPlaceholderText('Disabled input')).toBeDisabled();
  });

  it('accepts additional className', () => {
    render(<Input className="custom-input" placeholder="Custom" />);
    expect(screen.getByPlaceholderText('Custom')).toHaveClass('custom-input');
  });

  it('supports required attribute', () => {
    render(<Input required placeholder="Required" />);
    expect(screen.getByPlaceholderText('Required')).toBeRequired();
  });

  it('supports readOnly attribute', () => {
    render(<Input readOnly placeholder="Read only" />);
    expect(screen.getByPlaceholderText('Read only')).toHaveAttribute('readonly');
  });

  it('forwards ref correctly', () => {
    const ref = React.createRef<HTMLInputElement>();
    render(<Input ref={ref} placeholder="Ref test" />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });
});
