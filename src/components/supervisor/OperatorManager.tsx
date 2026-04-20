'use client';

import React, { useState, useEffect } from 'react';
import { Operator } from '@/lib/types/auth.types';
import { coreDb } from '@/lib/db/SystemDB';
import { OperatorTable } from './OperatorTable';
import { OperatorDetailPanel } from './OperatorDetailPanel';
import { RefreshCwIcon, UserPlusIcon } from '@/components/common/Icons';

interface OperatorManagerProps {
  initialOperatorId?: string | null;
}

export const OperatorManager: React.FC<OperatorManagerProps> = ({ initialOperatorId }) => {
  const [operators, setOperators] = useState<Operator[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const loadOperators = async () => {
    setIsLoading(true);
    try {
      const all = await coreDb.operators.toArray();
      setOperators(all);
    } catch (err) {
      console.error('[OPERATOR-MANAGER] Load failed', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const load = async () => {
      await loadOperators();
    };
    load();
  }, []);

  useEffect(() => {
    if (initialOperatorId && operators.length > 0) {
      const exists = operators.find(o => o.id === initialOperatorId);
      if (exists) {
        setSelectedId(initialOperatorId);
      }
    }
  }, [initialOperatorId, operators]);

  const selectedOperator = operators.find(o => o.id === selectedId) || null;

  return (
    <div className="operator-manager-layout animate-fade-in" style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '24px', height: 'calc(100vh - 250px)' }}>
      {/* LEFT: MASTER LIST */}
      <section className="station-card flex-col" style={{ height: '100%', overflow: 'hidden' }}>
        <OperatorTable 
          operators={operators}
          selectedId={selectedId}
          onSelect={setSelectedId}
          filter={filter}
          onFilterChange={setFilter}
        />
      </section>

      {/* RIGHT: DETAIL / EDITOR */}
      <section className="station-card flex-col" style={{ height: '100%', overflow: 'auto' }}>
        <OperatorDetailPanel 
          selected={selectedOperator} 
          onRefresh={loadOperators}
          onClear={() => setSelectedId(null)}
        />
      </section>

      <style jsx>{`
        .operator-manager-layout {
          margin-top: 24px;
        }
      `}</style>
    </div>
  );
};
