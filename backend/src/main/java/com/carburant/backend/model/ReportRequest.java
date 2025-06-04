package com.carburant.backend.model;

import java.util.Map;

/**
 * Model representing a request to generate a report
 */
public class ReportRequest {
    private String type;
    private String templateId;
    private String startDate;
    private String endDate;
    private String vehicleType;
    private Map<String, Object> parameters;
    private ReportFormat format;
    private String content;
    private boolean includeAiAnalysis;

    public enum ReportFormat {
        PDF, DOCX, XLSX
    }

    public ReportRequest() {
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getTemplateId() {
        return templateId;
    }

    public void setTemplateId(String templateId) {
        this.templateId = templateId;
    }

    public String getStartDate() {
        return startDate;
    }

    public void setStartDate(String startDate) {
        this.startDate = startDate;
    }

    public String getEndDate() {
        return endDate;
    }

    public void setEndDate(String endDate) {
        this.endDate = endDate;
    }

    public String getVehicleType() {
        return vehicleType;
    }

    public void setVehicleType(String vehicleType) {
        this.vehicleType = vehicleType;
    }

    public Map<String, Object> getParameters() {
        return parameters;
    }

    public void setParameters(Map<String, Object> parameters) {
        this.parameters = parameters;
    }

    public ReportFormat getFormat() {
        return format;
    }

    public void setFormat(ReportFormat format) {
        this.format = format;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public boolean isIncludeAiAnalysis() {
        return includeAiAnalysis;
    }

    public void setIncludeAiAnalysis(boolean includeAiAnalysis) {
        this.includeAiAnalysis = includeAiAnalysis;
    }
}
