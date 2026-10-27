import type { AnchorHTMLAttributes, ReactNode } from 'react';

type Props = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'target' | 'rel' | 'referrerPolicy'> & {
  href: string;
  children: ReactNode;
};

/**
 * The only way to open a link in a new tab. Always sets rel="noopener noreferrer"
 * (the new page can't reach back into Dumriya or see where it came from).
 * A test fails if any other code uses target="_blank".
 */
export function ExternalLink({ href, children, ...rest }: Props) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer" {...rest}>
      {children}
    </a>
  );
}
