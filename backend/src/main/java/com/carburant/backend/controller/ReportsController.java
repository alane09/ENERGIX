package com.carburant.backend.controller;

import java.util.List;

import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.carburant.backend.model.RegressionResult;
import com.carburant.backend.service.RegressionService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ReportsController {

    private final RegressionService regressionService;

    @GetMapping("/regression/export")
    public ResponseEntity<Resource> exportRegressionResults() {
        List<RegressionResult> results = regressionService.getAllRegressionResults();
        
        StringBuilder content = new StringBuilder();
        content.append("Type,Equation,R²,Adjusted R²,MSE\n");
        
        for (RegressionResult result : results) {
            content.append(String.format("%s,\"%s\",%f,%f,%f\n",
                result.getType(),
                result.getRegressionEquation(),
                result.getRSquared(),
                result.getAdjustedRSquared(),
                result.getMse()
            ));
        }

        byte[] reportBytes = content.toString().getBytes();
        ByteArrayResource resource = new ByteArrayResource(reportBytes);

        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=regression_results.csv")
            .contentType(MediaType.parseMediaType("text/csv"))
            .contentLength(reportBytes.length)
            .body(resource);
    }
}
