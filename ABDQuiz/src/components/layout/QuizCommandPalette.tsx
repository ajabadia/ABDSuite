'use client';

/**
 * @purpose Renderiza una pestaña de comandos con diversas acciones relacionadas a navegación, administración y configuración dentro de la aplicación ABDQuiz.
 * @purpose_en Renders a command palette with various actions related to navigation, administration, and settings within the ABDQuiz application.
 * @refactorable true (contains too many state variables and UI parts)
 * @classification UI Component
 * @complexity Low
 * @fingerprint exports:1,imports:5,sig:1js0qer
 * @lastUpdated 2026-07-02T18:47:25.484Z
 */

import React from 'react';
import { useRouter, usePathname } from '@/i18n/routing';
import { useLocale, useTranslations } from 'next-intl';
import { CommandPalette, Command } from '@ajabadia/ecosystem-widgets';
import { FileText, Clock, PenTool, Terminal, Globe, LogOut, Settings } from 'lucide-react';

export function QuizCommandPalette() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const q = useTranslations('quiz');

  const commands: Command[] = [
    {
      id: 'nav-exams',
      title: q('commandActiveExams'),
      description: q('commandActiveExamsDesc'),
      category: q('categoryAcademic'),
      shortcut: ['g', 'e'],
      icon: <FileText className="w-4 h-4" />,
      action: () => {
        router.push('/exams');
      }
    },
    {
      id: 'nav-history',
      title: q('commandHistoryGrades'),
      description: q('commandHistoryGradesDesc'),
      category: q('categoryAcademic'),
      shortcut: ['g', 'h'],
      icon: <Clock className="w-4 h-4" />,
      action: () => {
        router.push('/history');
      }
    },
    {
      id: 'nav-examinar',
      title: q('commandExaminerMode'),
      description: q('commandExaminerModeDesc'),
      category: q('categoryAdministration'),
      shortcut: ['g', 'x'],
      icon: <PenTool className="w-4 h-4" />,
      action: () => {
        router.push('/examinar');
      }
    },
    {
      id: 'nav-admin',
      title: q('commandAdminPanel'),
      description: q('commandAdminPanelDesc'),
      category: q('categoryAdministration'),
      shortcut: ['g', 'a'],
      icon: <Terminal className="w-4 h-4" />,
      action: () => {
        router.push('/admin');
      }
    },
    {
      id: 'action-language',
      title: q('commandSwitchLanguage'),
      description: q('commandSwitchLanguageDesc'),
      category: q('categorySettings'),
      shortcut: ['c', 'l'],
      icon: <Globe className="w-4 h-4" />,
      action: () => {
        const nextLocale = locale === 'es' ? 'en' : 'es';
        router.replace(pathname, { locale: nextLocale });
      }
    },
    {
      id: 'action-settings',
      title: q('commandSettingsPanel'),
      description: q('commandSettingsPanelDesc'),
      category: q('categorySettings'),
      shortcut: ['c', 's'],
      icon: <Settings className="w-4 h-4" />,
      action: () => {
        const settingsBtn = document.querySelector('[aria-label="Open Settings"]') as HTMLButtonElement;
        if (settingsBtn) {
          settingsBtn.click();
        }
      }
    },
    {
      id: 'action-logout',
      title: q('commandSignOut'),
      description: q('commandSignOutDesc'),
      category: q('categorySettings'),
      shortcut: ['q', 'q'],
      icon: <LogOut className="w-4 h-4" />,
      action: () => {
        window.location.href = '/api/abd-auth/logout';
      }
    }
  ];

  return (
    <CommandPalette
      commands={commands}
      placeholder={q('commandPlaceholder')}
    />
  );
}
