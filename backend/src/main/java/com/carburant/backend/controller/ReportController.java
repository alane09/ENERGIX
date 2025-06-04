package com.carburant.backend.controller;

import java.util.Collections;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.carburant.backend.dto.ReportRequest;
import com.carburant.backend.model.Report;
import com.carburant.backend.service.ReportService;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/reports")
public class ReportController {

    @Autowired
    private ReportService reportService;

    @PostMapping("/generate")
    public ResponseEntity<String> generateReport(@RequestBody ReportRequest request) {
        try {
            String downloadUrl = reportService.generateReport(request);
            return ResponseEntity.ok(downloadUrl);
        } catch (Exception e) {
            log.error("Error generating report", e);
            return ResponseEntity.badRequest().body("Error generating report: " + e.getMessage());
        }
    }

    @GetMapping
    public ResponseEntity<List<Report>> getReports() {
        try {
            List<Report> reports = reportService.getReports();
            return ResponseEntity.ok(reports);
        } catch (Exception e) {
            log.error("Error fetching reports", e);
            return ResponseEntity.ok(Collections.emptyList()); // Return empty list instead of error
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteReport(@PathVariable String id) {
        try {
            reportService.deleteReport(id);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            log.error("Error deleting report", e);
            return ResponseEntity.badRequest().body("Error deleting report: " + e.getMessage());
        }
    }
}
