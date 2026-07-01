'use client';

/**
 * @purpose Renderiza una pestaña de comandos con navegación y comandos relacionados con auditorías para la aplicación de archivos.
 * @purpose_en Renders a command palette with navigation and audit-related commands for the Files application.
 * @refactorable false
 * @classification UI Component
 * @complexity Low
 * @fingerprint exports:1,imports:5,sig:ylagww
 * @lastUpdated 2026-06-30T10:58:26.623Z
 */

import React from 'react';
import { useRouter, usePathname } from '@/i18n/routing';
import { useLocale } from 'next-intl';
import { CommandPalette, type Command, buildCommonCommands } from '@ajabadia/ecosystem-widgets';
import { HardDrive, History, FileText, FolderOpen } from 'lucide-react';

export function FilesCommandPalette() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();

  const commands: Command[] = [
    {
      id: 'nav-dashboard',
      title: locale === 'es' ? 'Panel de Control' : 'Dashboard',
      description: locale === 'es' ? 'Ir al panel de archivos central' : 'Go to the central files dashboard',
      category: locale === 'es' ? 'Navegación' : 'Navigation',
      shortcut: ['g', 'd'],
      icon: <HardDrive className="w-4 h-4" />,
      action: () => {
        router.push('/admin');
      }
    },
    {
      id: 'nav-storage',
      title: locale === 'es' ? 'Almacenamiento' : 'Storage',
      description: locale === 'es' ? 'Gestionar archivos y almacenamiento' : 'Manage files and storage',
      category: locale === 'es' ? 'Navegación' : 'Navigation',
      shortcut: ['g', 's'],
      icon: <FolderOpen className="w-4 h-4" />,
      action: () => {
        router.push('/admin');
      }
    },
    {
      id: 'nav-versions',
      title: locale === 'es' ? 'Versiones' : 'Version History',
      description: locale === 'es' ? 'Historial de versiones de archivos' : 'View file version history',
      category: locale === 'es' ? 'Navegación' : 'Navigation',
      shortcut: ['g', 'v'],
      icon: <History className="w-4 h-4" />,
      action: () => {
        router.push('/admin');
      }
    },
    {
      id: 'nav-audit',
      title: locale === 'es' ? 'Auditoría' : 'Audit Trail',
      description: locale === 'es' ? 'Trazabilidad de eventos de archivos' : 'File event traceability',
      category: locale === 'es' ? 'Navegación' : 'Navigation',
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
      placeholder={locale === 'es' ? 'Escribe un comando o navega...' : 'Type a command or navigate...'}
    />
  );
}
