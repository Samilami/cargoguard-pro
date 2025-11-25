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
    doc.setFillColor(30, 41, 59); // slate-800
    doc.rect(0, 0, pageWidth, 40, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('TRANSPORTPROTOKOLL', margin, 20);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Bericht-ID: ${report.id}`, margin, 28);
    doc.text(`Erstellt: ${new Date(report.createdAt).toLocaleString('de-DE')}`, margin, 33);

    doc.setTextColor(0, 0, 0);
    yPos = 50;

    // === STATUS BADGE ===
    if (report.status === 'submitted') {
      doc.setFillColor(34, 197, 94); // green
    } else {
      doc.setFillColor(234, 179, 8); // yellow
    }
    doc.roundedRect(pageWidth - margin - 40, 15, 40, 10, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    const statusText = report.status === 'submitted' ? 'ABGESCHLOSSEN' : 'ENTWURF';
    doc.text(statusText, pageWidth - margin - 35, 21);
    doc.setTextColor(0, 0, 0);

    // === VORBEHALT WARNING ===
    if (report.driver?.underReserve) {
      checkNewPage(20);
      doc.setFillColor(254, 243, 199); // yellow-100
      doc.setDrawColor(234, 179, 8);
      doc.setLineWidth(2);
      doc.roundedRect(margin, yPos, contentWidth, 15, 2, 2, 'FD');
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(161, 98, 7);
      doc.text('ANNAHME UNTER VORBEHALT', margin + 5, yPos + 6);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text('Pauschaler Vorbehalt ohne Angabe von Gruenden vermerkt', margin + 5, yPos + 11);
      doc.setTextColor(0, 0, 0);
      yPos += 20;
    }

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

      // Document details in a table
      checkNewPage(30);
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, yPos, contentWidth, 25, 'F');
      doc.setDrawColor(226, 232, 240);
      doc.rect(margin, yPos, contentWidth, 25);

      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.setFont('helvetica', 'bold');

      doc.text('NUMMER', margin + 3, yPos + 5);
      doc.text('DATUM', margin + 50, yPos + 5);
      doc.text('ABSENDER', margin + 3, yPos + 15);
      doc.text('EMPFAENGER', margin + 50, yPos + 15);

      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'normal');

      doc.text(report.document.deliveryNumber || '-', margin + 3, yPos + 10);
      doc.text(report.document.date || '-', margin + 50, yPos + 10);
      doc.text(report.document.sender || '-', margin + 3, yPos + 20);
      doc.text(report.document.recipient || '-', margin + 50, yPos + 20);

      yPos += 30;
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
        doc.setFillColor(241, 245, 249);
        doc.roundedRect(margin, yPos, contentWidth, 8, 1, 1, 'F');
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text(`Schaden #${i + 1}`, margin + 3, yPos + 5);
        yPos += 12;

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

        // Severity badge
        checkNewPage(15);
        if (dmg.severity === 'Schwer') {
          doc.setFillColor(254, 226, 226);
          doc.setTextColor(185, 28, 28);
        } else if (dmg.severity === 'Mittel') {
          doc.setFillColor(254, 243, 199);
          doc.setTextColor(180, 83, 9);
        } else {
          doc.setFillColor(220, 252, 231);
          doc.setTextColor(21, 128, 61);
        }
        doc.roundedRect(margin, yPos, 25, 6, 1, 1, 'F');
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.text(dmg.severity.toUpperCase(), margin + 2, yPos + 4);
        yPos += 10;

        // Categories
        if (dmg.categories && dmg.categories.length > 0) {
          doc.setTextColor(71, 85, 105);
          doc.setFontSize(8);
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
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, yPos, contentWidth, 20, 'F');
      doc.setDrawColor(226, 232, 240);
      doc.rect(margin, yPos, contentWidth, 20);

      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.setFont('helvetica', 'bold');

      doc.text('NAME', margin + 3, yPos + 5);
      doc.text('KENNZEICHEN', margin + 60, yPos + 5);
      doc.text('FIRMA / SPEDITION', margin + 3, yPos + 13);

      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'normal');

      doc.text(report.driver.name || '-', margin + 3, yPos + 10);
      doc.text(report.driver.licensePlate || '-', margin + 60, yPos + 10);
      doc.text(report.driver.company || '-', margin + 3, yPos + 18);

      yPos += 25;

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
    doc.text('INTERNER PRUEFER', margin, yPos);
    yPos += 8;

    doc.setFillColor(248, 250, 252);
    doc.rect(margin, yPos, contentWidth, 8, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.rect(margin, yPos, contentWidth, 8);

    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'bold');
    doc.text('MITARBEITER WARENEINGANG', margin + 3, yPos + 3);

    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    doc.text(report.employeeName || '-', margin + 3, yPos + 7);

    yPos += 15;

    // === FOOTER ===
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.setFont('helvetica', 'italic');
    const footerText = 'Generiert mit AvoCarbon CargoGuard Pro';
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
