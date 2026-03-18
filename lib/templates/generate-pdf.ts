import jsPDF from "jspdf";
import { LegalTemplate, FillData, fillText } from "./legal-templates";

/**
 * Generates a PDF from a legal template with filled data.
 * Uses jsPDF for client-side PDF generation.
 */
export function generatePDF(template: LegalTemplate, data: FillData): void {
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 72; // 1 inch
  const maxWidth = pageWidth - margin * 2;
  let y = margin;

  const lineHeight = 14;
  const paraSpacing = 10;
  const sectionSpacing = 20;

  function checkPage(needed: number) {
    const pageHeight = doc.internal.pageSize.getHeight();
    if (y + needed > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
  }

  function writeHeading(text: string) {
    const filled = fillText(text, data);
    doc.setFont("times", "bold");
    doc.setFontSize(11);
    const lines = doc.splitTextToSize(filled, maxWidth) as string[];
    checkPage(lines.length * lineHeight + paraSpacing);
    for (const line of lines) {
      doc.text(line, margin, y);
      y += lineHeight;
    }
    y += paraSpacing / 2;
  }

  function writeBody(text: string) {
    const filled = fillText(text, data);
    doc.setFont("times", "normal");
    doc.setFontSize(10);

    const paragraphs = filled.split("\n");
    for (const para of paragraphs) {
      if (para.trim() === "") {
        y += lineHeight * 0.5;
        continue;
      }
      const lines = doc.splitTextToSize(para, maxWidth) as string[];
      checkPage(lines.length * lineHeight);
      for (const line of lines) {
        doc.text(line, margin, y);
        y += lineHeight;
      }
    }
    y += paraSpacing;
  }

  // Title
  const title = fillText(template.sections[0]?.heading || template.title, data);
  doc.setFont("times", "bold");
  doc.setFontSize(13);
  const titleLines = doc.splitTextToSize(title, maxWidth) as string[];
  for (const line of titleLines) {
    const w = doc.getTextWidth(line);
    doc.text(line, (pageWidth - w) / 2, y);
    y += 18;
  }
  y += 10;

  // First section body (after using its heading as title)
  if (template.sections[0]?.body) {
    writeBody(template.sections[0].body);
  }

  // Remaining sections
  for (let i = 1; i < template.sections.length; i++) {
    const section = template.sections[i];
    checkPage(sectionSpacing + lineHeight * 2);
    y += sectionSpacing / 2;

    if (section.heading) {
      writeHeading(section.heading);
    }
    if (section.body) {
      writeBody(section.body);
    }
  }

  // Footer on each page
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont("times", "normal");
    doc.setFontSize(8);
    doc.setTextColor(150);
    const footer = `${fillText(template.title, data)} — Page ${i} of ${totalPages}`;
    doc.text(footer, margin, doc.internal.pageSize.getHeight() - 36);
    doc.setTextColor(0);
  }

  const filename = `${template.id}-${(data.companyName || "company").toLowerCase().replace(/\s+/g, "-")}.pdf`;
  doc.save(filename);
}
