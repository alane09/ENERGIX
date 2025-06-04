package com.carburant.backend.service;

import java.util.List;

import com.carburant.backend.dto.ReportRequest;
import com.carburant.backend.model.Report;

public interface ReportService {
    String generateReport(ReportRequest request) throws Exception;
    List<Report> getReports() throws Exception;
    void deleteReport(String id) throws Exception;
}
