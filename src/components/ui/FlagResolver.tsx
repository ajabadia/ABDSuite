import React, { useMemo } from 'react';
import * as Flags from '../icons/flags';

interface FlagResolverProps extends React.SVGProps<SVGSVGElement> {
  code: string; // ISO 2-letter code
}

/**
 * FlagResolver - Era 6
 * Resuelve y renderiza la bandera correspondiente al código ISO proporcionado.
 * Utiliza la librería de 600+ iconos de countries3.
 */
export const FlagResolver: React.FC<FlagResolverProps> = ({ code, ...props }) => {
  const normalizedCode = code?.toUpperCase();

  const FlagComponent = useMemo(() => {
    if (!normalizedCode) return Flags.CircleFlagXxIcon || Flags.WorldGlobeIcon || Flags.CountryIcon;

    // 1. Intento por ISO2 (Mayúscula inicial): CircleFlagEsIcon
    const isoName = `CircleFlag${normalizedCode.charAt(0)}${normalizedCode.slice(1).toLowerCase()}Icon`;
    let Component = (Flags as any)[isoName];
    if (Component) return Component;

    // 2. Intento por ISO2 (Todo mayúsculas): CircleFlagESIcon
    const isoUpperName = `CircleFlag${normalizedCode}Icon`;
    Component = (Flags as any)[isoUpperName];
    if (Component) return Component;

    // 3. Fallback a genérico
    return Flags.CircleFlagXxIcon || Flags.WorldGlobeIcon || Flags.CountryIcon;
  }, [normalizedCode]);

  // Si no hay componente, renderizar un placeholder aséptico (Círculo con borde)
  if (!FlagComponent) return (
    <div 
      className={props.className} 
      style={{ 
        width: props.width || '24px', 
        height: props.height || '24px', 
        borderRadius: '50%', 
        border: '1px dashed var(--text-secondary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '10px'
      }}
    >
      ?
    </div>
  );

  return <FlagComponent {...props} />;
};
