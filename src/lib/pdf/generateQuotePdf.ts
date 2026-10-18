import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Quote, Client, Organization, QuoteItem, Profile } from '@/types/database';

export function generateQuotePdfBuffer(
  quote: Quote,
  client: Client,
  org: Organization,
  items: QuoteItem[],
  createdByUser?: Profile
): Uint8Array {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  // 1. Franja Corporativa Superior (Teal #28B8AA)
  doc.setFillColor(40, 184, 170); // #28B8AA
  doc.rect(0, 0, pageWidth, 5, 'F');

  // 2. Encabezado de la Organización Emisora
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(11, 17, 24); // #0B1118
  doc.text(org.name || 'Acme Industrial & Services S.A.', 14, 20);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(`RUC: ${org.tax_id || '1792345678001'} | Moneda: ${org.currency || 'USD'}`, 14, 26);
  doc.text(`Zona Horaria: ${org.timezone || 'America/Guayaquil'}`, 14, 31);

  // 3. Cuadro de Información de Cotización (Derecha)
  doc.setFillColor(244, 247, 250);
  doc.roundedRect(pageWidth - 80, 12, 66, 24, 2, 2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(40, 184, 170);
  doc.text('COTIZACIÓN COMERCIAL', pageWidth - 76, 18);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(11, 17, 24);
  doc.text(quote.quote_number, pageWidth - 76, 25);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(`Emisión: ${quote.issue_date} | Vence: ${quote.valid_until}`, pageWidth - 76, 31);

  // Divisor sutil
  doc.setDrawColor(226, 232, 240);
  doc.line(14, 40, pageWidth - 14, 40);

  // 4. Datos del Cliente
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(11, 17, 24);
  doc.text('PREPARADO PARA:', 14, 46);

  doc.setFontSize(10);
  doc.text(client.name, 14, 52);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text(`Identificación (${client.identification_type}): ${client.identification_number}`, 14, 57);
  doc.text(`Correo: ${client.email} | Teléfono: ${client.phone || 'N/A'}`, 14, 62);
  if (client.address || client.city) {
    doc.text(`Ubicación: ${client.city || ''} ${client.address ? `• ${client.address}` : ''}`, 14, 67);
  }

  // Asesor Comercial
  if (createdByUser) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(11, 17, 24);
    doc.text('EJECUTIVO COMERCIAL:', pageWidth - 80, 46);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(createdByUser.full_name, pageWidth - 80, 52);
    doc.text(createdByUser.email, pageWidth - 80, 57);
  }

  // 5. Tabla de Ítems (jsPDF-AutoTable)
  const tableData = items.map((item, idx) => [
    idx + 1,
    item.description,
    item.quantity,
    `$${Number(item.unit_price).toFixed(2)}`,
    `${item.discount_percent}%`,
    `${item.tax_rate}%`,
    `$${Number(item.total_price).toFixed(2)}`,
  ]);

  autoTable(doc, {
    startY: 75,
    head: [['#', 'Descripción del Bien o Servicio', 'Cant.', 'Precio Unit.', 'Desc.', 'IVA', 'Total']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [21, 31, 42], // #151F2A
      textColor: [244, 247, 250],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'left',
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 41, 59],
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 14, halign: 'center' },
      3: { cellWidth: 24, halign: 'right' },
      4: { cellWidth: 16, halign: 'center' },
      5: { cellWidth: 14, halign: 'center' },
      6: { cellWidth: 26, halign: 'right', fontStyle: 'bold' },
    },
    margin: { left: 14, right: 14 },
  });

  // 6. Bloque de Totales Financieros
  const finalY = (doc as any).lastAutoTable.finalY + 8;

  const totalsBoxX = pageWidth - 75;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);

  doc.text('Subtotal:', totalsBoxX, finalY);
  doc.text(`$${Number(quote.subtotal).toFixed(2)} USD`, pageWidth - 14, finalY, { align: 'right' });

  doc.text('Descuento Total:', totalsBoxX, finalY + 6);
  doc.text(`-$${Number(quote.discount_total).toFixed(2)} USD`, pageWidth - 14, finalY + 6, { align: 'right' });

  doc.text('IVA (15%):', totalsBoxX, finalY + 12);
  doc.text(`$${Number(quote.tax_total).toFixed(2)} USD`, pageWidth - 14, finalY + 12, { align: 'right' });

  // Recuadro Total
  doc.setFillColor(40, 184, 170); // #28B8AA
  doc.roundedRect(totalsBoxX - 4, finalY + 16, 65, 10, 1.5, 1.5, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(11, 17, 24);
  doc.text('TOTAL A PAGAR:', totalsBoxX, finalY + 22.5);
  doc.text(`$${Number(quote.grand_total).toFixed(2)} USD`, pageWidth - 16, finalY + 22.5, { align: 'right' });

  // 7. Condiciones y Observaciones
  const notesY = finalY;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(11, 17, 24);
  doc.text('TÉRMINOS Y CONDICIONES:', 14, notesY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);

  const splitTerms = doc.splitTextToSize(quote.terms_conditions || 'Válido por 30 días calendario.', 95);
  doc.text(splitTerms, 14, notesY + 5);

  if (quote.notes) {
    doc.setFont('helvetica', 'bold');
    doc.text('NOTAS COMERCIALES:', 14, notesY + 18);
    doc.setFont('helvetica', 'normal');
    const splitNotes = doc.splitTextToSize(quote.notes, 95);
    doc.text(splitNotes, 14, notesY + 23);
  }

  // 8. Pie de Página y Firma de Aceptación
  const footerY = 265;
  doc.setDrawColor(203, 213, 225);
  doc.line(14, footerY, 80, footerY);
  doc.line(pageWidth - 80, footerY, pageWidth - 14, footerY);

  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('Firma Autorizada Emisor', 14, footerY + 5);
  doc.text('Aceptación de Oferta Cliente', pageWidth - 80, footerY + 5);

  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `Documento generado electrónicamente por Executive Dark CRM 2.0 • Identificador: ${quote.id}`,
    pageWidth / 2,
    285,
    { align: 'center' }
  );

  return new Uint8Array(doc.output('arraybuffer'));
}
