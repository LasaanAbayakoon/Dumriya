import type { AnchorHTMLAttributes, ReactNode, Ref } from 'react';

type Props = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'target' | 'rel' | 'referrerPolicy'> & {
  href: string;
  children: ReactNode;
  ref?: Ref<HTMLAnchorElement>;
};

/**
 * The only way to open a link in a new tab. Always sets rel="noopener noreferrer"
 * (the new page can't reach back into Dumriya or see where it came from).
 * A test fails if any other code uses target="_blank".
 */
export function ExternalLink({ href, children, ref, ...rest }: Props) {
  return (
    <a ref={ref} href={href} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer" {...rest}>
      {children}
    </a>
  );
}
