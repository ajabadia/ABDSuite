'use client'

/**
 * @purpose Renderiza una tabla para mostrar y gestionar delegaciones de roles dentro de un inquilino, incluyendo la capacidad de revocar delegaciones activas.
 * @purpose_en Renders a table to display and manage delegations of roles within a tenant, including the ability to revoke active delegations.
 * @refactorable true (contains too many state variables and UI parts)
 * @classification UI Component
 * @complexity Medium
 * @fingerprint exports:2,imports:8,sig:189wb41
 * @lastUpdated 2026-07-03T15:34:22.962Z
 */

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog, useConfirmDialog } from '@ajabadia/ecosystem-widgets';
import { fetchDelegationsAction, revokeDelegationAction } from './actions';
import { useTranslations } from 'next-intl';

export interface DelegationUI {
  _id: string;
  delegateeId: string;
  startsAt: string;
  expiresAt: string;
  isActive: boolean;
}

export function DelegationTable({ tenantId }: { tenantId: string }) {
  const [delegations, setDelegations] = useState<DelegationUI[]>([]);
  const [loading, setLoading] = useState(true);
  const t = useTranslations('admin');

  const loadDelegations = async () => {
    setLoading(true);
    const res = await fetchDelegationsAction(tenantId);
    if (res.data) {
      setDelegations(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadDelegations();
  }, [tenantId]);

  const revokeDialog = useConfirmDialog<string>({
    onConfirm: async (id) => {
      const res = await revokeDelegationAction(id, tenantId);
      if (res.success) {
        await loadDelegations();
      } else {
        toast.error(res.error || t('delegationsRevokeError'));
      }
    },
  });

  const handleRevoke = (id: string) => {
    revokeDialog.trigger(id);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{t('delegationsTitle')}</CardTitle>
        <CardDescription>
          {t('delegationsDesc')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground">{t('delegationsLoading')}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="p-3">{t('delegationsTableDelegate')}</th>
                  <th className="p-3">{t('delegationsTableStart')}</th>
                  <th className="p-3">{t('delegationsTableEnd')}</th>
                  <th className="p-3">{t('delegationsTableStatus')}</th>
                  <th className="p-3 text-right">{t('delegationsTableActions')}</th>
                </tr>
              </thead>
              <tbody>
                {delegations.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-4 text-center text-muted-foreground">{t('delegationsEmpty')}</td>
                  </tr>
                ) : (
                  delegations.map(del => {
                    const now = new Date();
                    const end = new Date(del.expiresAt);
                    const start = new Date(del.startsAt);
                    const isExpired = now > end;
                    const isActive = del.isActive && !isExpired && now >= start;

                    return (
                      <tr key={del._id} className="border-b hover:bg-muted/50 transition-colors">
                        <td className="p-3">{del.delegateeId}</td>
                        <td className="p-3">{start.toLocaleDateString()}</td>
                        <td className="p-3">{end.toLocaleDateString()}</td>
                        <td className="p-3">
                          {isActive ? (
                            <Badge className="bg-emerald-500/20 text-emerald-500 hover:bg-emerald-500/30">{t('delegationsBadgeActive')}</Badge>
                          ) : isExpired ? (
                            <Badge variant="outline" className="text-muted-foreground">{t('delegationsBadgeExpired')}</Badge>
                          ) : !del.isActive ? (
                            <Badge variant="destructive">{t('delegationsBadgeRevoked')}</Badge>
                          ) : (
                            <Badge variant="secondary">{t('delegationsBadgeScheduled')}</Badge>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          {(del.isActive && !isExpired) && (
                            <Button size="sm" variant="destructive" onClick={() => handleRevoke(del._id)}>
                              {t('delegationsRevokeBtn')}
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
      <ConfirmDialog
        open={revokeDialog.open}
        title={t('delegationsRevokeDialogTitle')}
        message={t('delegationsRevokeDialogMessage')}
        confirmLabel={t('delegationsRevokeDialogConfirm')}
        cancelLabel={t('delegationsRevokeDialogCancel')}
        variant="danger"
        isLoading={revokeDialog.isLoading}
        onConfirm={revokeDialog.confirm}
        onCancel={revokeDialog.cancel}
      />
    </Card>
  );
}
