package com.carburant.backend.service.impl;

import java.io.FileOutputStream;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;

import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.xssf.usermodel.XSSFSheet;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.apache.poi.xwpf.usermodel.ParagraphAlignment;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.apache.poi.xwpf.usermodel.XWPFParagraph;
import org.apache.poi.xwpf.usermodel.XWPFRun;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.stereotype.Service;

import com.carburant.backend.dto.ReportRequest;
import com.carburant.backend.exception.ResourceNotFoundException;
import com.carburant.backend.model.Report;
import com.carburant.backend.service.ReportService;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.properties.TextAlignment;

@Service
public class ReportServiceImpl implements ReportService {

    @Autowired
    private MongoTemplate mongoTemplate;

    @Override
    public String generateReport(ReportRequest request) throws Exception {
        validateRequest(request);

        String id = UUID.randomUUID().toString();
        LocalDateTime now = LocalDateTime.now();

        // Parse dates
        LocalDateTime startDate = LocalDateTime.parse(request.getStartDate());
        LocalDateTime endDate = LocalDateTime.parse(request.getEndDate());

        // Create report
        Report report = new Report();
        report.setId(id);
        report.setType(request.getType());
        report.setFormat(request.getFormat().toLowerCase());
        report.setDateGenerated(now);
        report.setStartDate(startDate);
        report.setEndDate(endDate);

        // Generate report based on format
        String downloadUrl;
        switch (request.getFormat().toLowerCase()) {
            case "pdf":
                downloadUrl = generatePdfReport(report, request);
                break;
            case "excel":
                downloadUrl = generateExcelReport(report, request);
                break;
            case "word":
                downloadUrl = generateWordReport(report, request);
                break;
            default:
                throw new IllegalArgumentException("Format non supporté: " + request.getFormat());
        }

        report.setDownloadUrl(downloadUrl);

        // Save to MongoDB
        mongoTemplate.save(report);

        return downloadUrl;
    }

    private void validateRequest(ReportRequest request) {
        if (request.getType() == null || request.getType().isEmpty()) {
            throw new IllegalArgumentException("Le type de rapport est requis");
        }
        if (request.getStartDate() == null || request.getStartDate().isEmpty()) {
            throw new IllegalArgumentException("La date de début est requise");
        }
        if (request.getEndDate() == null || request.getEndDate().isEmpty()) {
            throw new IllegalArgumentException("La date de fin est requise");
        }
        if (request.getFormat() == null || request.getFormat().isEmpty()) {
            throw new IllegalArgumentException("Le format est requis");
        }
    }

    private String generatePdfReport(Report report, ReportRequest request) throws Exception {
        String fileName = String.format("report_%s_%s.pdf", 
            report.getType(),
            report.getDateGenerated().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"))
        );
        String filePath = "downloads/reports/" + fileName;

        // Create PDF using iText
        PdfWriter writer = new PdfWriter(filePath);
        PdfDocument pdf = new PdfDocument(writer);
        Document document = new Document(pdf);

        // Add title
        document.add(new Paragraph("Rapport: " + report.getType())
            .setFontSize(24)
            .setBold()
            .setTextAlignment(TextAlignment.CENTER));

        // Add metadata
        document.add(new Paragraph("Généré le: " + report.getDateGenerated().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss"))));
        document.add(new Paragraph("Période: " + 
            report.getStartDate().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")) + " - " +
            report.getEndDate().format(DateTimeFormatter.ofPattern("dd/MM/yyyy"))));

        // Add report content
        addReportContent(document, report, request);

        document.close();
        return "/" + filePath;
    }

    private String generateExcelReport(Report report, ReportRequest request) throws Exception {
        String fileName = String.format("report_%s_%s.xlsx", 
            report.getType(),
            report.getDateGenerated().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"))
        );
        String filePath = "downloads/reports/" + fileName;

        // Create Excel workbook
        XSSFWorkbook workbook = new XSSFWorkbook();
        XSSFSheet sheet = workbook.createSheet("Rapport");

        // Add title
        Row titleRow = sheet.createRow(0);
        Cell titleCell = titleRow.createCell(0);
        titleCell.setCellValue("Rapport: " + report.getType());

        // Add metadata
        Row dateRow = sheet.createRow(1);
        dateRow.createCell(0).setCellValue("Généré le:");
        dateRow.createCell(1).setCellValue(report.getDateGenerated().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss")));

        Row periodRow = sheet.createRow(2);
        periodRow.createCell(0).setCellValue("Période:");
        periodRow.createCell(1).setCellValue(
            report.getStartDate().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")) + " - " +
            report.getEndDate().format(DateTimeFormatter.ofPattern("dd/MM/yyyy"))
        );

        // Add report content
        addExcelReportContent(workbook, sheet, report, request);

        // Write to file
        FileOutputStream fileOut = new FileOutputStream(filePath);
        workbook.write(fileOut);
        fileOut.close();
        workbook.close();

        return "/" + filePath;
    }

    private String generateWordReport(Report report, ReportRequest request) throws Exception {
        String fileName = String.format("report_%s_%s.docx", 
            report.getType(),
            report.getDateGenerated().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"))
        );
        String filePath = "downloads/reports/" + fileName;

        // Create Word document
        XWPFDocument document = new XWPFDocument();

        // Add title
        XWPFParagraph title = document.createParagraph();
        title.setAlignment(ParagraphAlignment.CENTER);
        XWPFRun titleRun = title.createRun();
        titleRun.setText("Rapport: " + report.getType());
        titleRun.setBold(true);
        titleRun.setFontSize(24);

        // Add metadata
        XWPFParagraph metadata = document.createParagraph();
        XWPFRun metadataRun = metadata.createRun();
        metadataRun.setText("Généré le: " + report.getDateGenerated().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss")));
        metadataRun.addBreak();
        metadataRun.setText("Période: " + 
            report.getStartDate().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")) + " - " +
            report.getEndDate().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")));

        // Add report content
        addWordReportContent(document, report, request);

        // Write to file
        FileOutputStream out = new FileOutputStream(filePath);
        document.write(out);
        out.close();
        document.close();

        return "/" + filePath;
    }

    private void addReportContent(Document document, Report report, ReportRequest request) {
        // Add summary section
        document.add(new Paragraph("Résumé").setFontSize(16).setBold());
        document.add(new Paragraph("Type de rapport: " + report.getType()));

        // Add data section
        document.add(new Paragraph("Données").setFontSize(16).setBold());
        if (request.getConsumption() != null && !request.getConsumption().isEmpty()) {
            for (var c : request.getConsumption()) {
                document.add(new Paragraph(
                    String.format("Date: %s | Consommation: %.2f | Distance: %s | Coût: %s | Véhicule: %s",
                        c.getDate(), c.getConsumption(),
                        c.getDistance() != null ? c.getDistance().toString() : "-",
                        c.getCost() != null ? c.getCost().toString() : "-",
                        c.getVehicleId() != null ? c.getVehicleId() : "-"
                    )
                ));
            }
        } else {
            document.add(new Paragraph("Aucune donnée de consommation disponible."));
        }

        // Add charts section (placeholder)
        document.add(new Paragraph("Graphiques").setFontSize(16).setBold());
        document.add(new Paragraph("Les graphiques seront générés en fonction des données disponibles."));

        // Add AI analysis section (placeholder)
        document.add(new Paragraph("Analyse AI").setFontSize(16).setBold());
        document.add(new Paragraph("Section d'analyse intelligente à venir."));

        // Add conclusion
        document.add(new Paragraph("Conclusion").setFontSize(16).setBold());
        document.add(new Paragraph("Ce rapport a été généré automatiquement par le système."));
    }

    private void addExcelReportContent(XSSFWorkbook workbook, XSSFSheet sheet, Report report, ReportRequest request) {
        // Create headers
        Row headerRow = sheet.createRow(4);
        headerRow.createCell(0).setCellValue("Date");
        headerRow.createCell(1).setCellValue("Consommation");
        headerRow.createCell(2).setCellValue("Coût");

        // Add real data
        if (request.getConsumption() != null && !request.getConsumption().isEmpty()) {
            int rowIdx = 5;
            for (var c : request.getConsumption()) {
                Row row = sheet.createRow(rowIdx++);
                row.createCell(0).setCellValue(c.getDate());
                row.createCell(1).setCellValue(c.getConsumption());
                row.createCell(2).setCellValue(c.getCost() != null ? c.getCost() : 0);
            }
        } else {
            Row row = sheet.createRow(5);
            row.createCell(0).setCellValue("Aucune donnée");
        }

        // Auto-size columns
        for (int i = 0; i < 3; i++) {
            sheet.autoSizeColumn(i);
        }
    }

    private void addWordReportContent(XWPFDocument document, Report report, ReportRequest request) {
        // Add summary section
        XWPFParagraph summary = document.createParagraph();
        XWPFRun summaryRun = summary.createRun();
        summaryRun.setText("Résumé");
        summaryRun.setBold(true);
        summaryRun.setFontSize(16);
        summaryRun.addBreak();

        XWPFParagraph summaryContent = document.createParagraph();
        XWPFRun summaryContentRun = summaryContent.createRun();
        summaryContentRun.setText("Type de rapport: " + report.getType());
        summaryContentRun.addBreak();

        // Add data section
        XWPFParagraph data = document.createParagraph();
        XWPFRun dataRun = data.createRun();
        dataRun.setText("Données");
        dataRun.setBold(true);
        dataRun.setFontSize(16);
        dataRun.addBreak();

        if (request.getConsumption() != null && !request.getConsumption().isEmpty()) {
            for (var c : request.getConsumption()) {
                XWPFParagraph dataContent = document.createParagraph();
                XWPFRun dataContentRun = dataContent.createRun();
                dataContentRun.setText(
                    String.format("Date: %s | Consommation: %.2f | Distance: %s | Coût: %s | Véhicule: %s",
                        c.getDate(), c.getConsumption(),
                        c.getDistance() != null ? c.getDistance().toString() : "-",
                        c.getCost() != null ? c.getCost().toString() : "-",
                        c.getVehicleId() != null ? c.getVehicleId() : "-"
                    )
                );
                dataContentRun.addBreak();
            }
        } else {
            XWPFParagraph dataContent = document.createParagraph();
            XWPFRun dataContentRun = dataContent.createRun();
            dataContentRun.setText("Aucune donnée de consommation disponible.");
            dataContentRun.addBreak();
        }

        // Add AI analysis section (placeholder)
        XWPFParagraph aiSection = document.createParagraph();
        XWPFRun aiRun = aiSection.createRun();
        aiRun.setText("Analyse AI");
        aiRun.setBold(true);
        aiRun.setFontSize(16);
        aiRun.addBreak();

        XWPFParagraph aiContent = document.createParagraph();
        XWPFRun aiContentRun = aiContent.createRun();
        aiContentRun.setText("Section d'analyse intelligente à venir.");
        aiContentRun.addBreak();

        // Add conclusion
        XWPFParagraph conclusion = document.createParagraph();
        XWPFRun conclusionRun = conclusion.createRun();
        conclusionRun.setText("Conclusion");
        conclusionRun.setBold(true);
        conclusionRun.setFontSize(16);
        conclusionRun.addBreak();

        XWPFParagraph conclusionContent = document.createParagraph();
        XWPFRun conclusionContentRun = conclusionContent.createRun();
        conclusionContentRun.setText("Ce rapport a été généré automatiquement par le système.");
    }

    @Override
    public List<Report> getReports() throws Exception {
        return mongoTemplate.findAll(Report.class);
    }

    @Override
    public void deleteReport(String id) throws Exception {
        Report report = mongoTemplate.findById(id, Report.class);
        if (report != null) {
            mongoTemplate.remove(report);
        } else {
            throw new ResourceNotFoundException("Report not found with id: " + id);
        }
    }
}
