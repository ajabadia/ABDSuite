import esCommon from '../../locales/es/common.json';
import esShell from '../../locales/es/shell.json';
import esCrypt from '../../locales/es/crypt.json';
import esEtl from '../../locales/es/etl.json';
import esOperator from '../../locales/es/operator.json';
import esLetter from '../../locales/es/letter.json';
import esAudit from '../../locales/es/audit.json';
import esSupervisor from '../../locales/es/supervisor.json';
import esAuth from '../../locales/es/auth.json';

import enCommon from '../../locales/en/common.json';
import enShell from '../../locales/en/shell.json';
import enCrypt from '../../locales/en/crypt.json';
import enEtl from '../../locales/en/etl.json';
import enOperator from '../../locales/en/operator.json';
import enLetter from '../../locales/en/letter.json';
import enAudit from '../../locales/en/audit.json';
import enSupervisor from '../../locales/en/supervisor.json';
import enAuth from '../../locales/en/auth.json';

import frCommon from '../../locales/fr/common.json';
import frShell from '../../locales/fr/shell.json';
import frCrypt from '../../locales/fr/crypt.json';
import frEtl from '../../locales/fr/etl.json';
import frOperator from '../../locales/fr/operator.json';
import frLetter from '../../locales/fr/letter.json';
import frAudit from '../../locales/fr/audit.json';
import frAuth from '../../locales/fr/auth.json';

import deCommon from '../../locales/de/common.json';
import deShell from '../../locales/de/shell.json';
import deCrypt from '../../locales/de/crypt.json';
import deEtl from '../../locales/de/etl.json';
import deOperator from '../../locales/de/operator.json';
import deLetter from '../../locales/de/letter.json';
import deAudit from '../../locales/de/audit.json';
import deAuth from '../../locales/de/auth.json';

/**
 * Consolidación modular de traducciones.
 * El objeto resultante mantiene la estructura plana/anidada esperada por useLanguage.
 */
export const translations = {
  es: {
    ...esCommon,
    ...esShell,
    ...esCrypt,
    ...esEtl,
    ...esOperator,
    ...esLetter,
    ...esAudit,
    ...esSupervisor,
    ...esAuth
  },
  en: {
    ...enCommon,
    ...enShell,
    ...enCrypt,
    ...enEtl,
    ...enOperator,
    ...enLetter,
    ...enAudit,
    ...enSupervisor,
    ...enAuth
  },
  fr: {
    ...frCommon,
    ...frShell,
    ...frCrypt,
    ...frEtl,
    ...frOperator,
    ...frLetter,
    ...frAudit,
    ...frAuth
  },
  de: {
    ...deCommon,
    ...deShell,
    ...deCrypt,
    ...deEtl,
    ...deOperator,
    ...deLetter,
    ...deAudit,
    ...deAuth
  }
} as const;
