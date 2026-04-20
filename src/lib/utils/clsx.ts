/**
 * ABDFN Industrial Clsx (Vendorized)
 * A aseptic implementation of the clsx utility to ensure zero external network dependencies
 * in high-integrity industrial environments.
 */

type ClassValue = string | number | boolean | undefined | null | { [key: string]: any } | ClassValue[];

export function clsx(...inputs: ClassValue[]): string {
  let i = 0;
  let tmp: any;
  let str = '';
  const len = inputs.length;

  for (; i < len; i++) {
    if (tmp = inputs[i]) {
      if (typeof tmp === 'string') {
        str += (str && ' ') + tmp;
      } else if (Array.isArray(tmp)) {
        const x = clsx(...tmp);
        if (x) str += (str && ' ') + x;
      } else if (typeof tmp === 'object') {
        for (const k in tmp) {
          if (tmp[k]) {
            str += (str && ' ') + k;
          }
        }
      }
    }
  }

  return str;
}

export default clsx;
