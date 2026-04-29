// Coverage for the deferred-validation NumberInput. The whole point is
// that mid-edit typing isn't fought by the clamp — these tests verify
// every step of that promise: free typing, blur-to-commit, Enter,
// Esc-revert, and external-value sync.

import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render } from '@testing-library/react';
import { useState } from 'react';
import { NumberInput } from './NumberInput';

describe('NumberInput', () => {
  it('shows the initial value', () => {
    const { getByRole } = render(<NumberInput value={42} onChange={() => {}} />);
    expect((getByRole('spinbutton') as HTMLInputElement).value).toBe('42');
  });

  it('lets the user type freely without clamping mid-edit', () => {
    const onChange = vi.fn();
    const { getByRole } = render(
      <NumberInput value={108} min={30} max={300} onChange={onChange} />,
    );
    const input = getByRole('spinbutton') as HTMLInputElement;
    // The user clears + retypes — naive validation would have clamped
    // each keystroke. We expect onChange NOT to fire mid-edit, only
    // on commit.
    fireEvent.change(input, { target: { value: '' } });
    expect(input.value).toBe('');
    fireEvent.change(input, { target: { value: '1' } });
    expect(input.value).toBe('1');
    fireEvent.change(input, { target: { value: '10' } });
    expect(input.value).toBe('10');
    fireEvent.change(input, { target: { value: '108' } });
    expect(input.value).toBe('108');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('commits + clamps on blur', () => {
    const onChange = vi.fn();
    const { getByRole } = render(
      <NumberInput value={100} min={30} max={300} onChange={onChange} />,
    );
    const input = getByRole('spinbutton') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '500' } });
    fireEvent.blur(input);
    expect(onChange).toHaveBeenCalledWith(300);
    expect(input.value).toBe('300');
  });

  it('commits on Enter', () => {
    const onChange = vi.fn();
    const { getByRole } = render(
      <NumberInput value={100} onChange={onChange} />,
    );
    const input = getByRole('spinbutton') as HTMLInputElement;
    input.focus();
    fireEvent.change(input, { target: { value: '120' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    // The Enter handler calls input.blur(); jsdom dispatches blur sync.
    fireEvent.blur(input); // belt-and-suspenders for jsdom
    expect(onChange).toHaveBeenCalledWith(120);
  });

  it('reverts on Escape without committing', () => {
    const onChange = vi.fn();
    const { getByRole } = render(
      <NumberInput value={100} onChange={onChange} />,
    );
    const input = getByRole('spinbutton') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '999' } });
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(onChange).not.toHaveBeenCalled();
    expect(input.value).toBe('100');
  });

  it('reverts to current value on empty / non-numeric blur', () => {
    const onChange = vi.fn();
    const { getByRole } = render(
      <NumberInput value={50} min={0} max={100} onChange={onChange} />,
    );
    const input = getByRole('spinbutton') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '' } });
    fireEvent.blur(input);
    expect(input.value).toBe('50');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('does not call onChange when committed value equals current', () => {
    const onChange = vi.fn();
    const { getByRole } = render(
      <NumberInput value={75} min={0} max={100} onChange={onChange} />,
    );
    const input = getByRole('spinbutton') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '75' } });
    fireEvent.blur(input);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('syncs external value updates while not focused', () => {
    function Harness() {
      const [v, setV] = useState(50);
      return (
        <>
          <NumberInput value={v} onChange={setV} />
          <button type="button" onClick={() => setV(80)}>set 80</button>
        </>
      );
    }
    const { getByRole, getByText } = render(<Harness />);
    const input = getByRole('spinbutton') as HTMLInputElement;
    expect(input.value).toBe('50');
    fireEvent.click(getByText('set 80'));
    expect(input.value).toBe('80');
  });

  it('handles floats with step < 1 + decimals override', () => {
    const onChange = vi.fn();
    const { getByRole } = render(
      <NumberInput value={0.5} min={0} max={1} step={0.05} decimals={2} onChange={onChange} />,
    );
    const input = getByRole('spinbutton') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '0.75' } });
    fireEvent.blur(input);
    expect(onChange).toHaveBeenCalledWith(0.75);
    expect(input.value).toBe('0.75');
  });

  it('respects custom step + min/max for floats', () => {
    const onChange = vi.fn();
    const { getByRole } = render(
      <NumberInput value={0.5} min={0} max={1} step={0.05} onChange={onChange} />,
    );
    const input = getByRole('spinbutton') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '1.5' } });
    fireEvent.blur(input);
    expect(onChange).toHaveBeenCalledWith(1);
  });
});
