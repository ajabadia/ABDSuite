"use client";

/**
 * @purpose Gestiona eventos de clic fuera de un elemento especificado y desencadena una función de manejo.
 * @purpose_en Handles click events outside a specified element and triggers a handler function.
 * @refactorable false
 * @classification Custom Hook
 * @complexity Low
 * @fingerprint exports:1,imports:2,sig:wb8lu5
 * @lastUpdated 2026-06-21T14:26:20.051Z
 */

import { useEffect } from 'react';
import type { RefObject } from 'react';

export function useClickOutside<T extends HTMLElement>(
  ref: RefObject<T | null>,
  handler: (event: MouseEvent) => void
) {
  useEffect(() => {
    const listener = (event: MouseEvent) => {
      if (!ref.current || ref.current.contains(event.target as Node)) {
        return;
      }
      handler(event);
    };

    document.addEventListener('mousedown', listener);
    return () => {
      document.removeEventListener('mousedown', listener);
    };
  }, [ref, handler]);
}
