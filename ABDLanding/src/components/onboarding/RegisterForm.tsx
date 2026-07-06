'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';

type FormErrors = Partial<Record<'organizationName' | 'dbPrefix' | 'contactEmail' | 'contactName', string>>;

const trackEvent = (eventType: string, metadata?: Record<string, unknown>) => {
  fetch('/api/v1/telemetry', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ eventType, metadata }),
    keepalive: true,
  }).catch(() => {});
};

export default function RegisterForm() {
  const t = useTranslations('home');
  useEffect(() => { trackEvent('PageView', { page: 'register' }); }, []);

  const [form, setForm] = useState({
    organizationName: '',
    dbPrefix: '',
    contactEmail: '',
    contactName: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [apiError, setApiError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const validate = (): FormErrors => {
    const errs: FormErrors = {};
    if (form.organizationName.length < 3) errs.organizationName = t('errOrgName');
    if (!/^[a-z0-9]{3,10}$/.test(form.dbPrefix))
      errs.dbPrefix = t('errDbPrefix');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contactEmail)) errs.contactEmail = t('errEmail');
    if (form.contactName.length < 2) errs.contactName = t('errYourName');
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError('');

    const clientErrors = validate();
    setErrors(clientErrors);
    if (Object.keys(clientErrors).length > 0) return;

    setLoading(true);
    trackEvent('OnboardingAttempt', {
      organizationName: form.organizationName,
      dbPrefix: form.dbPrefix,
    });
    try {
      const res = await fetch('/api/v1/onboarding/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Unknown error' }));
        setApiError(data.error || `Error ${res.status}`);
        trackEvent('OnboardingFailure', {
          organizationName: form.organizationName,
          dbPrefix: form.dbPrefix,
          error: data.error || `Error ${res.status}`,
        });
        return;
      }

      setSuccess(true);
      trackEvent('OnboardingSuccess', {
        organizationName: form.organizationName,
        dbPrefix: form.dbPrefix,
      });
    } catch {
      setApiError(t('errNetwork'));
      trackEvent('OnboardingFailure', {
        organizationName: form.organizationName,
        dbPrefix: form.dbPrefix,
        error: 'Network error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  if (success) {
    return (
      <div className="flex flex-col items-center gap-4 p-8 text-center" role="status">
        <CheckCircle className="w-12 h-12 text-emerald-400" aria-hidden="true" />
        <h2 className="text-xl font-bold text-foreground">{t('onboardingSuccess')}</h2>
        <p className="text-sm text-muted-foreground max-w-md">
          {t('onboardingSuccessDesc', { email: form.contactEmail })}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
      {apiError && (
        <div
          className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm"
          role="alert"
        >
          <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>{apiError}</span>
        </div>
      )}

      <div className="flex flex-col gap-1">
        <label htmlFor="org-name" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {t('orgName')}
        </label>
        <input
          id="org-name"
          type="text"
          value={form.organizationName}
          onChange={handleChange('organizationName')}
          placeholder="e.g. My Academy"
          aria-label={t('orgName')}
          aria-invalid={!!errors.organizationName}
          className="px-3 py-2 bg-background border border-border text-foreground text-sm rounded-none focus:outline-none focus:ring-1 focus:ring-primary/50"
        />
        {errors.organizationName && (
          <span className="text-xs text-red-400" role="alert">{errors.organizationName}</span>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="db-prefix" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {t('dbPrefix')}
        </label>
        <input
          id="db-prefix"
          type="text"
          value={form.dbPrefix}
          onChange={handleChange('dbPrefix')}
          placeholder="e.g. myacademy"
          aria-label={t('dbPrefix')}
          aria-invalid={!!errors.dbPrefix}
          className="px-3 py-2 bg-background border border-border text-foreground text-sm rounded-none focus:outline-none focus:ring-1 focus:ring-primary/50 font-mono"
        />
        {errors.dbPrefix && (
          <span className="text-xs text-red-400" role="alert">{errors.dbPrefix}</span>
        )}
        <span className="text-[11px] text-muted-foreground">{t('dbPrefixDesc')}</span>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="contact-name" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {t('yourName')}
        </label>
        <input
          id="contact-name"
          type="text"
          value={form.contactName}
          onChange={handleChange('contactName')}
          placeholder="e.g. John Doe"
          aria-label={t('yourName')}
          aria-invalid={!!errors.contactName}
          className="px-3 py-2 bg-background border border-border text-foreground text-sm rounded-none focus:outline-none focus:ring-1 focus:ring-primary/50"
        />
        {errors.contactName && (
          <span className="text-xs text-red-400" role="alert">{errors.contactName}</span>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="contact-email" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {t('email')}
        </label>
        <input
          id="contact-email"
          type="email"
          value={form.contactEmail}
          onChange={handleChange('contactEmail')}
          placeholder="e.g. john@academy.com"
          aria-label={t('email')}
          aria-invalid={!!errors.contactEmail}
          className="px-3 py-2 bg-background border border-border text-foreground text-sm rounded-none focus:outline-none focus:ring-1 focus:ring-primary/50"
        />
        {errors.contactEmail && (
          <span className="text-xs text-red-400" role="alert">{errors.contactEmail}</span>
        )}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground text-sm font-semibold rounded-none hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label={loading ? t('submitting') : t('registerBtn')}
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
        {loading ? t('submitting') : t('registerBtn')}
      </button>
    </form>
  );
}
