/**
 * Industrial CSV Delimiter Detector
 * Priorities: ; (European/Banking) > , (Standard) > \t (Tab) > | (Pipe)
 */

const CANDIDATES = [';', ',', '\t', '|'] as const;
export type CsvDelimiter = (typeof CANDIDATES)[number];

interface DetectOptions {
  maxLines?: number;
  minColumns?: number;
}

interface DelimiterStats {
  delimiter: CsvDelimiter;
  columnCounts: number[];
  validLines: number;
}

export function detectCsvDelimiter(
  text: string,
  options: DetectOptions = {},
): CsvDelimiter {
  const { maxLines = 20, minColumns = 2 } = options;

  const lines = text
    .split(/\r\n|\n|\r/)
    .filter(l => l.trim().length > 0)
    .slice(0, maxLines);

  if (lines.length === 0) {
    return ';'; // Industrial Default fallback
  }

  const stats: DelimiterStats[] = CANDIDATES.map(d => ({
    delimiter: d,
    columnCounts: [],
    validLines: 0,
  }));

  for (const line of lines) {
    for (const s of stats) {
      const cols = splitRespectingQuotes(line, s.delimiter).length;
      s.columnCounts.push(cols);
      if (cols >= minColumns) {
        s.validLines += 1;
      }
    }
  }

  // Choose the candidate with highest consistency
  const ranked = stats
    .filter(s => s.validLines > 0)
    .map(s => {
      const uniqueCounts = new Set(s.columnCounts);
      const consistency = 1 / uniqueCounts.size; // 1.0 is perfect consistency
      const avgCols = s.columnCounts.reduce((a, b) => a + b, 0) / s.columnCounts.length;
      
      return {
        delimiter: s.delimiter,
        score: consistency * s.validLines * avgCols
      };
    })
    .sort((a, b) => b.score - a.score);

  return ranked.length > 0 ? ranked[0].delimiter : ';';
}

/**
 * Splits a CSV line respecting double quotes
 */
export function splitRespectingQuotes(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];

    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (ch === delimiter && !inQuotes) {
      result.push(current.trim());
      current = '';
      continue;
    }

    current += ch;
  }

  result.push(current.trim());
  return result;
}
