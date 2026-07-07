declare module '@ajabadia/styles' {
  export function generateTenantCss(themeConfig: any): string;
  export type TenantThemeConfig = Record<string, any>;
  export function adjustColor(color: string, amount: number): string;
  export function getContrastColor(color: string): string;
  export function hexToHslComponents(hex: string): { h: number; s: number; l: number };
}
