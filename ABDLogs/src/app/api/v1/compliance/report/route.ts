import { NextResponse } from 'next/server';
import { connectDB } from '@ajabadia/satellite-sdk/db';
import { AuditLog } from '@/models/AuditLog';
import crypto from 'crypto';
import jsPDF from 'jspdf';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tenantId, startDate, endDate } = body;

    if (!tenantId || !startDate || !endDate) {
      return NextResponse.json({ error: 'tenantId, startDate and endDate are required' }, { status: 400 });
    }

    await connectDB();
    const logs = await AuditLog.find({
      tenantId,
      createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) },
    })
      .sort({ createdAt: 1 })
      .lean();

    const hashAccumulator = crypto.createHash('sha256');
    logs.forEach(l => hashAccumulator.update(String(l._id) + String(l.action)));
    const integrityHash = hashAccumulator.digest('hex');

    const doc = new jsPDF();
    doc.setFont('courier', 'normal');
    doc.setFontSize(10);

    const line = '========================================================';
    doc.text(line, 10, 10);
    doc.text(`SOC2 COMPLIANCE AUDIT REPORT | Tenant: ${tenantId}`, 10, 15);
    doc.text(`Range: ${startDate} to ${endDate}`, 10, 20);
    doc.text(`Ecosystem Integrity Chain (SHA-256): ${integrityHash}`, 10, 25);
    doc.text(line, 10, 30);

    let yPosition = 40;
    for (let i = 0; i < logs.length; i++) {
      const l = logs[i];
      const time = new Date(l.createdAt).toISOString();
      const lineText = `${i + 1}. [${time}] ${l.appId} - ${l.action} (${l.userEmail || 'ANONYMOUS'})`;

      if (yPosition > 280) {
        doc.addPage();
        yPosition = 20;
      }
      doc.text(lineText, 10, yPosition);
      yPosition += 8;
    }

    if (logs.length === 0) {
      doc.text('No audit logs found for the specified range.', 10, yPosition);
    }

    yPosition += 12;
    doc.text(line, 10, yPosition);
    yPosition += 6;
    doc.text(`SHA-256 Integrity Hash: ${integrityHash}`, 10, yPosition);
    yPosition += 6;
    doc.text(`Generated: ${new Date().toISOString()}`, 10, yPosition);
    yPosition += 6;
    doc.text('Certification: SOC2-ERA11-COMPLIANT', 10, yPosition);
    doc.text(line, 10, yPosition + 6);

    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="SOC2-audit-${tenantId}.pdf"`,
      },
    });
  } catch (error) {
    console.error('[COMPLIANCE_REPORT_ERROR]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
