import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Link, type LinkProps } from 'react-router';
import { buttonClass, type Size, type Variant } from './buttonClass';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size; icon?: ReactNode };

export function Button({ variant, size, icon, className = '', children, type = 'button', ...rest }: ButtonProps) {
  return (
    <button type={type} className={buttonClass(variant, size, className)} {...rest}>
      {icon}
      <span className="min-w-0">{children}</span>
    </button>
  );
}

type ButtonLinkProps = Omit<LinkProps, 'children'> & {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
  children: ReactNode;
};

export function ButtonLink({ variant, size, icon, className = '', children, ...rest }: ButtonLinkProps) {
  return (
    <Link className={buttonClass(variant, size, className)} {...rest}>
      {icon}
      <span className="min-w-0">{children}</span>
    </Link>
  );
}
