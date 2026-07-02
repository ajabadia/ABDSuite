'use client';

/**
 * @purpose Renderiza una pestaña de comandos con navegación y comandos relacionados con auditorías para la aplicación de archivos.
 * @purpose_en Renders a command palette with navigation and audit-related commands for the Files application.
 * @refactorable false
 * @classification UI Component
 * @complexity Low
 * @fingerprint exports:1,imports:5,sig:15umecw
 * @lastUpdated 2026-07-02T18:45:47.697Z
 */

import React from 'react';
import { useRouter, usePathname } from '@/i18n/routing';
import { useLocale, useTranslations } from 'next-intl';
import { CommandPalette, type Command, buildCommonCommands } from '@ajabadia/ecosystem-widgets';
import { HardDrive, History, FileText, FolderOpen } from 'lucide-react';

export function FilesCommandPalette() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations('common');

  const commands: Command[] = [
    {
      id: 'nav-dashboard',
      title: t('commandPalette.filesDashboard'),
      description: t('commandPalette.filesDashboardDesc'),
      category: t('commandPalette.categoryNavigation'),
      shortcut: ['g', 'd'],
      icon: <HardDrive className="w-4 h-4" />,
      action: () => {
        router.push('/admin');
      }
    },
    {
      id: 'nav-storage',
      title: t('commandPalette.filesStorage'),
      description: t('commandPalette.filesStorageDesc'),
      category: t('commandPalette.categoryNavigation'),
      shortcut: ['g', 's'],
      icon: <FolderOpen className="w-4 h-4" />,
      action: () => {
        router.push('/admin');
      }
    },
    {
      id: 'nav-versions',
      title: t('commandPalette.filesVersions'),
      description: t('commandPalette.filesVersionsDesc'),
      category: t('commandPalette.categoryNavigation'),
      shortcut: ['g', 'v'],
      icon: <History className="w-4 h-4" />,
      action: () => {
        router.push('/admin');
      }
    },
    {
      id: 'nav-audit',
      title: t('commandPalette.filesAudit'),
      description: t('commandPalette.filesAuditDesc'),
      category: t('commandPalette.categoryNavigation'),
      shortcut: ['g', 'a'],
      icon: <FileText className="w-4 h-4" />,
      action: () => {
        router.push('/admin/audit');
      }
    },
    ...buildCommonCommands({ locale, pathname, router, onLogout: () => { window.location.href = '/api/abd-auth/logout'; } })
  ];

  return (
    <CommandPalette
      commands={commands}
      placeholder={t('commandPalette.filesPlaceholder')}
    />
  );
}
