// Shared disclosure widget — a thin wrapper around <details><summary> that
// injects a consistent caret glyph via CSS (see .bf-disclosure rules in
// app.css). Used everywhere a section collapses:
//   - Practice sidebar: pattern list + "about this rhythm"
//   - Library: "Browse by Grouping"
// Call sites keep their own outer/inner class names for layout; Disclosure
// only owns the caret + its rotation animation.

import type { DetailsHTMLAttributes, ReactNode } from 'react';

interface DisclosureProps
  extends Omit<DetailsHTMLAttributes<HTMLDetailsElement>, 'children'> {
  /** Contents of the <summary> after the caret — free-form. */
  summary: ReactNode;
  /** Extra classes applied to the <summary> element. */
  summaryClassName?: string;
  children: ReactNode;
}

export function Disclosure({
  summary,
  summaryClassName = '',
  className = '',
  children,
  ...rest
}: DisclosureProps) {
  return (
    <details className={`bf-disclosure ${className}`.trim()} {...rest}>
      <summary className={`bf-disclosure-summary ${summaryClassName}`.trim()}>
        {summary}
      </summary>
      {children}
    </details>
  );
}
