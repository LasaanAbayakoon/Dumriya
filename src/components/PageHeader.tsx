import type { ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { BackIcon } from './icons';
import { SampleDataBanner } from './SampleDataBanner';

type Props = {
  title: string;
  back?: boolean | string;
  actions?: ReactNode;
  badge?: ReactNode;
  /** Set on screens that show train data: adds the permanent sample-data bar while the mock API is active. */
  sampleData?: boolean;
};

/** Sticky screen header. Each screen renders exactly one, which provides its <h1>. */
export function PageHeader({ title, back, actions, badge, sampleData }: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const goBack = () => {
    if (typeof back === 'string') void navigate(back);
    else if (window.history.state?.idx > 0) void navigate(-1);
    else void navigate('/');
  };

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-bg/95 backdrop-blur">
      <div className="mx-auto flex max-w-2xl items-center gap-1 px-2 py-1">
        {back ? (
          <button
            type="button"
            onClick={goBack}
            className="tap inline-flex items-center justify-center rounded-full text-accent hover:bg-accent-soft"
          >
            <BackIcon title={t('common.back')} />
          </button>
        ) : (
          <span className="w-2" />
        )}
        <h1 className="min-w-0 flex-1 py-2 text-xl font-bold leading-tight [overflow-wrap:anywhere]">{title}</h1>
        {badge}
        {actions}
      </div>
      {sampleData && <SampleDataBanner />}
    </header>
  );
}
