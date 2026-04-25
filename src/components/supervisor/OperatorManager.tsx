'use client';

import React, { useState, useEffect } from 'react';
import { Operator } from '@/lib/types/auth.types';
import { operatorService } from '@/lib/services/OperatorService';
import { OperatorTable } from './OperatorTable';
import { OperatorDetailPanel } from './OperatorDetailPanel';
import { useWorkspace } from '@/lib/context/WorkspaceContext';
import { auditService } from '@/lib/services/AuditService';

interface OperatorManagerProps {
  initialOperatorId?: string | null;
}

export const OperatorManager: React.FC<OperatorManagerProps> = ({ initialOperatorId }) => {
  const [operators, setOperators] = useState<Operator[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const { requestStepUp, currentOperator } = useWorkspace();

  const loadOperators = async () => {
    setIsLoading(true);
    try {
      const all = await operatorService.list();
      setOperators(all);
    } catch (err) {
      console.error('[OPERATOR-MANAGER] Load failed', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOperators();
  }, []);

  useEffect(() => {
    if (initialOperatorId && operators.length > 0) {
      const exists = operators.find(o => o.id === initialOperatorId);
      if (exists) {
        setSelectedId(initialOperatorId);
      }
    }
  }, [initialOperatorId, operators]);

  const handleExport = async () => {
    const fresh = await requestStepUp(2);
    if (!fresh) return;

    try {
      const data = operators.map(o => ({
          username: o.username,
          displayName: o.displayName,
          role: o.role,
          isActive: o.isActive,
          lastLogin: o.lastLogin
      }));
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `OPERATORS_EXPORT_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);

      await auditService.log({
          module: 'SUPERVISOR',
          messageKey: 'operator.export.success',
          status: 'SUCCESS',
          operatorId: currentOperator?.id,
          details: {
              eventType: 'OPERATOR_EXPORT',
              entityType: 'OPERATOR_DATABASE',
              actorId: currentOperator?.id,
              actorUser: currentOperator?.username,
              severity: 'WARN'
          }
      });
    } catch (err) {
      console.error('[EXPORT] Failed', err);
    }
  };

  const selectedOperator = operators.find(o => o.id === selectedId) || null;

  return (
    <div className="flex-row fade-in" style={{ gap: '24px', height: 'calc(100vh - 250px)', marginTop: '24px' }}>
      {/* LEFT: MASTER LIST */}
      <section className="station-card flex-col" style={{ flex: 1.2, height: '100%', overflow: 'hidden', padding: 0 }}>
        <OperatorTable 
          operators={operators}
          selectedId={selectedId}
          onSelect={setSelectedId}
          filter={filter}
          onFilterChange={setFilter}
          onExport={handleExport}
        />
      </section>

      {/* RIGHT: DETAIL / EDITOR */}
      <section className="station-card flex-col" style={{ flex: 0.8, height: '100%', overflow: 'auto' }}>
        <OperatorDetailPanel 
          selected={selectedOperator} 
          onRefresh={loadOperators}
          onClear={() => setSelectedId(null)}
        />
      </section>
    </div>
  );
};
