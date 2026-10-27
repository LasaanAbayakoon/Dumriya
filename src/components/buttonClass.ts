export type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type Size = 'md' | 'lg';

const variants: Record<Variant, string> = {
  primary: 'bg-accent text-accent-contrast hover:bg-accent-hover',
  secondary: 'bg-surface text-accent border border-border hover:bg-accent-soft',
  ghost: 'text-accent hover:bg-accent-soft',
  danger: 'bg-surface text-danger border border-border hover:bg-danger-soft',
};

const sizes: Record<Size, string> = {
  md: 'px-4 py-2 text-base',
  lg: 'px-5 py-3 text-lg w-full',
};

export function buttonClass(variant: Variant = 'primary', size: Size = 'md', extra = ''): string {
  return [
    'tap inline-flex items-center justify-center gap-2 rounded-xl font-semibold text-center',
    'leading-snug [overflow-wrap:anywhere] transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
    variants[variant],
    sizes[size],
    extra,
  ].join(' ');
}

