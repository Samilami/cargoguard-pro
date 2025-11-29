import jsPDF from 'jspdf';
import { InspectionReport } from '../types';

export async function generateReportPDF(report: InspectionReport): Promise<void> {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPos = 20;
  const margin = 15;
  const contentWidth = pageWidth - 2 * margin;

  // Helper function to check if we need a new page
  const checkNewPage = (requiredSpace: number) => {
    if (yPos + requiredSpace > pageHeight - 20) {
      doc.addPage();
      yPos = 20;
      return true;
    }
    return false;
  };

  // Helper function to add image with size constraints
  const addImage = async (dataUrl: string, maxWidth: number, maxHeight: number) => {
    return new Promise<{ width: number; height: number }>((resolve) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        const aspectRatio = width / height;

        // Scale to fit within constraints
        if (width > maxWidth) {
          width = maxWidth;
          height = width / aspectRatio;
        }
        if (height > maxHeight) {
          height = maxHeight;
          width = height * aspectRatio;
        }

        resolve({ width: width * 0.264583, height: height * 0.264583 }); // Convert px to mm
      };
      img.src = dataUrl;
    });
  };

  try {
    // === HEADER ===
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);
    doc.line(margin, yPos, pageWidth - margin, yPos);

    yPos += 5;
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('TRANSPORTPROTOKOLL', margin, yPos);

    yPos += 8;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Bericht-ID: ${report.id}`, margin, yPos);

    yPos += 5;
    doc.text(`Erstellt: ${new Date(report.createdAt).toLocaleString('de-DE')}`, margin, yPos);

    yPos += 3;
    const statusText = report.status === 'submitted' ? 'ABGESCHLOSSEN' : 'ENTWURF';
    doc.text(`Status: ${statusText}`, margin, yPos);

    yPos += 5;
    doc.setLineWidth(0.5);
    doc.line(margin, yPos, pageWidth - margin, yPos);

    yPos += 10;

    // === LIEFERSCHEIN ===
    checkNewPage(60);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('LIEFERSCHEIN', margin, yPos);
    yPos += 8;

    if (report.document) {
      // Document image
      if (report.document.imageUrl) {
        checkNewPage(80);
        const imgDims = await addImage(report.document.imageUrl, contentWidth, 70);
        doc.addImage(report.document.imageUrl, 'JPEG', margin, yPos, imgDims.width, imgDims.height);
        yPos += imgDims.height + 5;
      }

      // Document details
      checkNewPage(30);
      doc.setFontSize(9);
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'bold');

      doc.text('Nummer:', margin, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(report.document.deliveryNumber || '-', margin + 25, yPos);
      yPos += 5;

      doc.setFont('helvetica', 'bold');
      doc.text('Datum:', margin, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(report.document.date || '-', margin + 25, yPos);
      yPos += 5;

      doc.setFont('helvetica', 'bold');
      doc.text('Absender:', margin, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(report.document.sender || '-', margin + 25, yPos);
      yPos += 5;

      doc.setFont('helvetica', 'bold');
      doc.text('Empfänger:', margin, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(report.document.recipient || '-', margin + 25, yPos);

      yPos += 10;
    }

    // === SCHAEDEN ===
    checkNewPage(20);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(`SCHAEDEN (${report.damages.length})`, margin, yPos);
    yPos += 8;

    if (report.damages.length === 0) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(148, 163, 184);
      doc.text('Keine Schaeden verzeichnet.', margin, yPos);
      yPos += 10;
    } else {
      for (let i = 0; i < report.damages.length; i++) {
        const dmg = report.damages[i];
        checkNewPage(100);

        // Damage header
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text(`Schaden #${i + 1}`, margin, yPos);
        yPos += 7;

        // Images (up to 3 per row)
        if (dmg.imageUrls && dmg.imageUrls.length > 0) {
          const imgsPerRow = 3;
          const imgWidth = (contentWidth - 10) / imgsPerRow;

          for (let imgIdx = 0; imgIdx < dmg.imageUrls.length; imgIdx++) {
            if (imgIdx % imgsPerRow === 0 && imgIdx > 0) {
              yPos += 45;
              checkNewPage(45);
            }

            const xOffset = margin + (imgIdx % imgsPerRow) * (imgWidth + 2);
            const imgDims = await addImage(dmg.imageUrls[imgIdx], imgWidth - 2, 40);

            checkNewPage(imgDims.height + 5);
            doc.addImage(dmg.imageUrls[imgIdx], 'JPEG', xOffset, yPos, imgDims.width, imgDims.height);
          }
          yPos += 45;
        }

        // Severity and Categories
        checkNewPage(15);
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text(`Schweregrad: ${dmg.severity}`, margin, yPos);
        yPos += 5;

        // Categories
        if (dmg.categories && dmg.categories.length > 0) {
          doc.setTextColor(0, 0, 0);
          doc.setFontSize(9);
          doc.setFont('helvetica', 'normal');
          doc.text('Kategorien: ' + dmg.categories.join(', '), margin, yPos);
          yPos += 5;
        }

        // Description
        if (dmg.description) {
          checkNewPage(15);
          doc.setTextColor(0, 0, 0);
          doc.setFontSize(9);
          doc.setFont('helvetica', 'normal');
          const lines = doc.splitTextToSize(dmg.description, contentWidth - 10);
          doc.text(lines, margin, yPos);
          yPos += lines.length * 5;
        }

        yPos += 5;
      }
    }

    // === FAHRER ===
    checkNewPage(60);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('FAHRER', margin, yPos);
    yPos += 8;

    if (report.driver) {
      doc.setFontSize(9);
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'bold');

      doc.text('Name:', margin, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(report.driver.name || '-', margin + 30, yPos);
      yPos += 5;

      doc.setFont('helvetica', 'bold');
      doc.text('Kennzeichen:', margin, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(report.driver.licensePlate || '-', margin + 30, yPos);
      yPos += 5;

      doc.setFont('helvetica', 'bold');
      doc.text('Firma:', margin, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(report.driver.company || '-', margin + 30, yPos);

      yPos += 10;

      // Signature
      if (report.driver.signatureDataUrl) {
        checkNewPage(50);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('Unterschrift:', margin, yPos);
        yPos += 5;

        const sigDims = await addImage(report.driver.signatureDataUrl, 60, 30);
        doc.addImage(report.driver.signatureDataUrl, 'PNG', margin, yPos, sigDims.width, sigDims.height);
        yPos += sigDims.height + 5;
      }
    }

    // === MITARBEITER ===
    checkNewPage(15);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('INTERNER PRUEFER', margin, yPos);
    yPos += 8;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Mitarbeiter:', margin, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(report.employeeName || '-', margin + 30, yPos);

    yPos += 10;

    // === VORBEHALT NOTICE ===
    checkNewPage(15);
    doc.setLineWidth(0.5);
    doc.setDrawColor(0, 0, 0);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 5;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Vermerk: Annahme unter Vorbehalt', margin, yPos);
    yPos += 5;
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 10;

    // === FOOTER ===
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.setFont('helvetica', 'italic');
    const footerText = 'Generiert mit AvoCarbon Transportschaden Dokumentation';
    const footerWidth = doc.getTextWidth(footerText);
    doc.text(footerText, (pageWidth - footerWidth) / 2, pageHeight - 10);

    // Save PDF
    const filename = `Bericht_${report.id}_${new Date(report.createdAt).toLocaleDateString('de-DE').replace(/\./g, '-')}.pdf`;
    doc.save(filename);

  } catch (error) {
    console.error('PDF generation error:', error);
    throw new Error('Fehler beim Erstellen des PDFs');
  }
}
