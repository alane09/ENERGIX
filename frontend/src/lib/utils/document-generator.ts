import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, BorderStyle, WidthType, AlignmentType } from 'docx';
import * as ExcelJS from 'exceljs';

// Company branding configuration
const COMPANY_BRANDING = {
  name: 'COFICAB ENERGIX',
  logo: '/logo.png', // Path to logo
  primaryColor: '#4CAF50',
  secondaryColor: '#48BB78',
  fontFamily: 'Arial',
};

// Interface for document data
export interface DocumentData {
  title: string;
  subtitle?: string;
  date: string;
  content: string;
  charts?: any[];
  tables?: any[];
  analysis?: {
    summary?: string;
    insights?: string[];
    recommendations?: string[];
  };
  includeBranding?: boolean;
}

/**
 * Document generation utility class
 */
export class DocumentGenerator {
  /**
   * Generate a PDF document
   * @param data Document data
   * @returns PDF document as Blob
   */
  static async generatePDF(data: DocumentData): Promise<Blob> {
    // Create a new PDF document
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    // Set font
    doc.setFont(COMPANY_BRANDING.fontFamily);

    // Add branding if requested
    if (data.includeBranding !== false) {
      // Add logo
      // In a real implementation, this would load and add the company logo
      // doc.addImage(COMPANY_BRANDING.logo, 'PNG', 10, 10, 30, 10);
      
      // Add company name
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(COMPANY_BRANDING.name, 180, 10, { align: 'right' });

      // Add footer
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(`${COMPANY_BRANDING.name} - Page ${i} of ${pageCount}`, 105, 290, { align: 'center' });
      }
    }

    // Add title
    doc.setFontSize(18);
    doc.setTextColor(0, 0, 0);
    doc.text(data.title, 105, 30, { align: 'center' });

    // Add subtitle if provided
    if (data.subtitle) {
      doc.setFontSize(14);
      doc.setTextColor(100, 100, 100);
      doc.text(data.subtitle, 105, 40, { align: 'center' });
    }

    // Add date
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Date: ${data.date}`, 105, 50, { align: 'center' });

    // Add content
    // In a real implementation, this would parse the HTML content and add it to the PDF
    // For this example, we'll just add some placeholder text
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text('Contenu du rapport', 20, 70);
    doc.setFontSize(10);
    doc.text('Ce rapport contient une analyse détaillée de la consommation de carburant.', 20, 80);

    // Add AI analysis if provided
    if (data.analysis) {
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text('Analyse IA', 20, 120);

      if (data.analysis.summary) {
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.text('Résumé', 20, 130);
        doc.setFontSize(10);
        doc.text(data.analysis.summary, 20, 140, { maxWidth: 170 });
      }

      if (data.analysis.insights && data.analysis.insights.length > 0) {
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.text('Insights', 20, 170);
        doc.setFontSize(10);
        data.analysis.insights.forEach((insight, index) => {
          doc.text(`• ${insight}`, 20, 180 + (index * 10), { maxWidth: 170 });
        });
      }

      if (data.analysis.recommendations && data.analysis.recommendations.length > 0) {
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.text('Recommandations', 20, 220);
        doc.setFontSize(10);
        data.analysis.recommendations.forEach((recommendation, index) => {
          doc.text(`• ${recommendation}`, 20, 230 + (index * 10), { maxWidth: 170 });
        });
      }
    }

    // Return the PDF as a Blob
    return doc.output('blob');
  }

  /**
   * Generate a Word document
   * @param data Document data
   * @returns Word document as Blob
   */
  static async generateWord(data: DocumentData): Promise<Blob> {
    // Create a new Word document
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            // Title
            new Paragraph({
              text: data.title,
              heading: HeadingLevel.HEADING_1,
              alignment: AlignmentType.CENTER,
            }),

            // Subtitle if provided
            ...(data.subtitle ? [
              new Paragraph({
                text: data.subtitle,
                heading: HeadingLevel.HEADING_2,
                alignment: AlignmentType.CENTER,
              }),
            ] : []),

            // Date
            new Paragraph({
              text: `Date: ${data.date}`,
              alignment: AlignmentType.CENTER,
            }),

            // Spacing
            new Paragraph({}),

            // Content
            // In a real implementation, this would parse the HTML content and add it to the Word document
            // For this example, we'll just add some placeholder text
            new Paragraph({
              text: 'Contenu du rapport',
              heading: HeadingLevel.HEADING_2,
            }),
            new Paragraph({
              text: 'Ce rapport contient une analyse détaillée de la consommation de carburant.',
            }),

            // Spacing
            new Paragraph({}),
          ],
        },
      ],
    });

    // Add AI analysis if provided
    if (data.analysis) {
      doc.addSection({
        children: [
          new Paragraph({
            text: 'Analyse IA',
            heading: HeadingLevel.HEADING_2,
          }),

          // Summary
          ...(data.analysis.summary ? [
            new Paragraph({
              text: 'Résumé',
              heading: HeadingLevel.HEADING_3,
            }),
            new Paragraph({
              text: data.analysis.summary,
            }),
            new Paragraph({}),
          ] : []),

          // Insights
          ...(data.analysis.insights && data.analysis.insights.length > 0 ? [
            new Paragraph({
              text: 'Insights',
              heading: HeadingLevel.HEADING_3,
            }),
            ...data.analysis.insights.map(insight => new Paragraph({
              text: `• ${insight}`,
            })),
            new Paragraph({}),
          ] : []),

          // Recommendations
          ...(data.analysis.recommendations && data.analysis.recommendations.length > 0 ? [
            new Paragraph({
              text: 'Recommandations',
              heading: HeadingLevel.HEADING_3,
            }),
            ...data.analysis.recommendations.map(recommendation => new Paragraph({
              text: `• ${recommendation}`,
            })),
          ] : []),
        ],
      });
    }

    // Generate the Word document
    return await Packer.toBlob(doc);
  }

  /**
   * Generate an Excel spreadsheet
   * @param data Document data
   * @returns Excel spreadsheet as Blob
   */
  static async generateExcel(data: DocumentData): Promise<Blob> {
    // Create a new workbook
    const workbook = new ExcelJS.Workbook();
    
    // Add metadata
    workbook.creator = COMPANY_BRANDING.name;
    workbook.lastModifiedBy = COMPANY_BRANDING.name;
    workbook.created = new Date();
    workbook.modified = new Date();

    // Add a worksheet for the report
    const worksheet = workbook.addWorksheet('Rapport');

    // Add title
    worksheet.mergeCells('A1:H1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = data.title;
    titleCell.font = {
      size: 16,
      bold: true,
      color: { argb: '000000' },
    };
    titleCell.alignment = { horizontal: 'center' };

    // Add subtitle if provided
    if (data.subtitle) {
      worksheet.mergeCells('A2:H2');
      const subtitleCell = worksheet.getCell('A2');
      subtitleCell.value = data.subtitle;
      subtitleCell.font = {
        size: 14,
        bold: true,
        color: { argb: '666666' },
      };
      subtitleCell.alignment = { horizontal: 'center' };
    }

    // Add date
    worksheet.mergeCells('A3:H3');
    const dateCell = worksheet.getCell('A3');
    dateCell.value = `Date: ${data.date}`;
    dateCell.font = {
      size: 12,
      color: { argb: '666666' },
    };
    dateCell.alignment = { horizontal: 'center' };

    // Add content header
    worksheet.mergeCells('A5:H5');
    const contentHeaderCell = worksheet.getCell('A5');
    contentHeaderCell.value = 'Contenu du rapport';
    contentHeaderCell.font = {
      size: 14,
      bold: true,
      color: { argb: '000000' },
    };

    // Add content
    worksheet.mergeCells('A6:H6');
    const contentCell = worksheet.getCell('A6');
    contentCell.value = 'Ce rapport contient une analyse détaillée de la consommation de carburant.';
    contentCell.font = {
      size: 12,
      color: { argb: '000000' },
    };

    // Add AI analysis if provided
    if (data.analysis) {
      // Add analysis header
      worksheet.mergeCells('A8:H8');
      const analysisHeaderCell = worksheet.getCell('A8');
      analysisHeaderCell.value = 'Analyse IA';
      analysisHeaderCell.font = {
        size: 14,
        bold: true,
        color: { argb: '000000' },
      };

      // Add summary if provided
      if (data.analysis.summary) {
        worksheet.mergeCells('A9:H9');
        const summaryHeaderCell = worksheet.getCell('A9');
        summaryHeaderCell.value = 'Résumé';
        summaryHeaderCell.font = {
          size: 12,
          bold: true,
          color: { argb: '000000' },
        };

        worksheet.mergeCells('A10:H10');
        const summaryCell = worksheet.getCell('A10');
        summaryCell.value = data.analysis.summary;
        summaryCell.font = {
          size: 12,
          color: { argb: '000000' },
        };
      }

      // Add insights if provided
      if (data.analysis.insights && data.analysis.insights.length > 0) {
        worksheet.mergeCells('A12:H12');
        const insightsHeaderCell = worksheet.getCell('A12');
        insightsHeaderCell.value = 'Insights';
        insightsHeaderCell.font = {
          size: 12,
          bold: true,
          color: { argb: '000000' },
        };

        data.analysis.insights.forEach((insight, index) => {
          const rowIndex = 13 + index;
          worksheet.mergeCells(`A${rowIndex}:H${rowIndex}`);
          const insightCell = worksheet.getCell(`A${rowIndex}`);
          insightCell.value = `• ${insight}`;
          insightCell.font = {
            size: 12,
            color: { argb: '000000' },
          };
        });
      }

      // Add recommendations if provided
      if (data.analysis.recommendations && data.analysis.recommendations.length > 0) {
        const startRow = data.analysis.insights ? 13 + data.analysis.insights.length + 1 : 12;
        
        worksheet.mergeCells(`A${startRow}:H${startRow}`);
        const recommendationsHeaderCell = worksheet.getCell(`A${startRow}`);
        recommendationsHeaderCell.value = 'Recommandations';
        recommendationsHeaderCell.font = {
          size: 12,
          bold: true,
          color: { argb: '000000' },
        };

        data.analysis.recommendations.forEach((recommendation, index) => {
          const rowIndex = startRow + 1 + index;
          worksheet.mergeCells(`A${rowIndex}:H${rowIndex}`);
          const recommendationCell = worksheet.getCell(`A${rowIndex}`);
          recommendationCell.value = `• ${recommendation}`;
          recommendationCell.font = {
            size: 12,
            color: { argb: '000000' },
          };
        });
      }
    }

    // Set column widths
    worksheet.columns.forEach((column: any) => {
      column.width = 15;
    });

    // Generate the Excel file
    const buffer = await workbook.xlsx.writeBuffer();
    return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  }
}
