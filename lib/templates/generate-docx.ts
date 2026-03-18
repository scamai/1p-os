import {
  Document,
  Paragraph,
  TextRun,
  AlignmentType,
  Packer,
  PageNumber,
  NumberFormat,
  Footer,
} from "docx";
import { saveAs } from "file-saver";
import { LegalTemplate, FillData, fillText } from "./legal-templates";

/**
 * Generates a DOCX from a legal template with filled data.
 * Uses the docx library for client-side Word document generation.
 */
export async function generateDOCX(
  template: LegalTemplate,
  data: FillData
): Promise<void> {
  const children: Paragraph[] = [];

  // Title from first section heading
  const titleText = fillText(
    template.sections[0]?.heading || template.title,
    data
  );
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 240 },
      children: [
        new TextRun({
          text: titleText,
          bold: true,
          size: 26,
          font: "Times New Roman",
        }),
      ],
    })
  );

  // First section body
  if (template.sections[0]?.body) {
    addBody(children, template.sections[0].body, data);
  }

  // Remaining sections
  for (let i = 1; i < template.sections.length; i++) {
    const section = template.sections[i];

    // Section spacing
    children.push(new Paragraph({ spacing: { before: 200 } }));

    if (section.heading) {
      children.push(
        new Paragraph({
          spacing: { after: 120 },
          children: [
            new TextRun({
              text: fillText(section.heading, data),
              bold: true,
              size: 22,
              font: "Times New Roman",
            }),
          ],
        })
      );
    }

    if (section.body) {
      addBody(children, section.body, data);
    }
  }

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440, // 1 inch in twips
              right: 1440,
              bottom: 1440,
              left: 1440,
            },
            pageNumbers: { start: 1 },
          },
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: fillText(template.title, data) + " — Page ",
                    size: 16,
                    font: "Times New Roman",
                    color: "999999",
                  }),
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    size: 16,
                    font: "Times New Roman",
                    color: "999999",
                  }),
                  new TextRun({
                    text: " of ",
                    size: 16,
                    font: "Times New Roman",
                    color: "999999",
                  }),
                  new TextRun({
                    children: [PageNumber.TOTAL_PAGES],
                    size: 16,
                    font: "Times New Roman",
                    color: "999999",
                  }),
                ],
              }),
            ],
          }),
        },
        children,
      },
    ],
    numbering: { config: [] },
    styles: {
      default: {
        document: {
          run: {
            font: "Times New Roman",
            size: 20,
          },
          paragraph: {
            spacing: { line: 276 },
          },
        },
      },
    },
  });

  const blob = await Packer.toBlob(doc);
  const filename = `${template.id}-${(data.companyName || "company").toLowerCase().replace(/\s+/g, "-")}.docx`;
  saveAs(blob, filename);
}

function addBody(children: Paragraph[], text: string, data: FillData) {
  const filled = fillText(text, data);
  const paragraphs = filled.split("\n");

  for (const para of paragraphs) {
    if (para.trim() === "") {
      children.push(new Paragraph({ spacing: { before: 80 } }));
      continue;
    }
    children.push(
      new Paragraph({
        spacing: { after: 80 },
        children: [
          new TextRun({
            text: para,
            size: 20,
            font: "Times New Roman",
          }),
        ],
      })
    );
  }
}
