import { useTranslations } from 'next-intl';
import Link from 'next/link';
import RegisterForm from '@/components/onboarding/RegisterForm';
import { ArrowLeft } from 'lucide-react';

export default function RegisterPage() {
  const t = useTranslations('home');

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 px-4 py-12">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          {t('loginHint') || 'Back to home'}
        </Link>

        <div className="p-6 bg-zinc-900/60 border border-zinc-800">
          <h1 className="text-xl font-bold mb-1 text-foreground">{t('onboardingTitle')}</h1>
          <p className="text-sm text-muted-foreground mb-6">
            {t('onboardingDesc')}
          </p>
          <RegisterForm />
        </div>
      </div>
    </main>
  );
}
