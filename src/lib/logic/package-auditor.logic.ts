/**
 * Package Auditor Logic
 * Compliance: 02-code-quality-architecture (English logic)
 * Compliance: 04-compliance-security (Zero-Knowledge, Safe ZIP handling)
 * 
 * This module cross-references a GAWEB index with a ZIP archive.
 */

import JSZip from 'jszip';
import { GawebAuditResult } from './gaweb-auditor.logic';
import { md5 } from '../utils/crypto.utils';

export interface PackageAuditResult {
  zipFilesCount: number;
  missingFiles: string[];
  orphanedFiles: string[];
  md5Match?: boolean;
}

/**
 * Cross-references GAWEB records with ZIP archive entries.
 */
export async function auditPackageIntegrity(
  gaweb: GawebAuditResult, 
  zipBlob: Blob,
  md5Witness?: string
): Promise<PackageAuditResult> {
  const zip = new JSZip();
  const content = await zip.loadAsync(zipBlob);
  const zipFileNames = Object.keys(content.files);
  const normalizedZipNames = new Set(zipFileNames.map(n => n.toLowerCase()));
  
  const result: PackageAuditResult = {
    zipFilesCount: zipFileNames.length,
    missingFiles: [],
    orphanedFiles: [],
  };

  // 1. MD5 Witness Check (Optional)
  if (md5Witness) {
     const buffer = await zipBlob.arrayBuffer();
     const textContent = new TextDecoder().decode(new Uint8Array(buffer));
     const calculatedMd5 = md5(textContent); // Simplified for browser blobs
     result.md5Match = (calculatedMd5.toLowerCase() === md5Witness.trim().toLowerCase());
  }

  // 2. Cross-Integrity Check
  // Each record in GAWEB must have a corresponding PDF in the ZIP
  const gawebReferencedFiles = new Set<string>();

  gaweb.parsedData.forEach((record, index) => {
    const rawPdfName = record['PdfName'] || '';
    const cleanPdfName = rawPdfName.trim();
    
    if (cleanPdfName) {
      const targetFile = `${cleanPdfName}.pdf`.toLowerCase();
      gawebReferencedFiles.add(targetFile);

      if (!normalizedZipNames.has(targetFile)) {
        // Add to gaweb errors as well for UI visibility
        gaweb.errors.push({
          line: index + 1,
          field: 'PdfName',
          position: '212-251', // Modern position for PdfName
          severity: 'ERROR',
          messageKey: 'audit.errors.missing_pdf',
          value: cleanPdfName
        });
        result.missingFiles.push(cleanPdfName);
      }
    }
  });

  // 3. Orphan Check (Optional Warnings)
  // Check if there are PDFs in the ZIP that are not in the index
  zipFileNames.forEach(zipFile => {
    if (zipFile.toLowerCase().endsWith('.pdf') && !gawebReferencedFiles.has(zipFile.toLowerCase())) {
      result.orphanedFiles.push(zipFile);
      // Add a warning to the overall audit
      gaweb.warnings.push({
        line: 0,
        field: 'ZIP',
        position: 'N/A',
        severity: 'WARNING',
        messageKey: 'audit.errors.orphaned_pdf',
        value: zipFile
      });
    }
  });

  return result;
}
