package com.carburant.backend.controller;

import java.util.List;
import java.util.Optional;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.carburant.backend.model.MonthlyData;
import com.carburant.backend.model.RegressionCoefficients;
import com.carburant.backend.model.RegressionResult;
import com.carburant.backend.model.VehicleRecord;
import com.carburant.backend.service.RegressionService;
import com.carburant.backend.service.ValidationService;
import com.carburant.backend.service.VehicleService;
import com.carburant.backend.utils.DataTransformUtils;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/regression")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class RegressionController {

    private final RegressionService regressionService;
    private final VehicleService vehicleService;
    private final ValidationService validationService;

    @GetMapping("/search")
    public ResponseEntity<RegressionResult> searchRegressionResult(
            @RequestParam String type,
            @RequestParam String year,
            @RequestParam(required = false) String region) {
        try {
            Optional<RegressionResult> result;
            if (region != null) {
                result = regressionService.getRegressionResultByTypeAndYearAndRegion(type, year, region);
            } else {
                result = regressionService.getRegressionResultByTypeAndYear(type, year);
            }
            return result.map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            log.error("Error searching regression results", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping
    public ResponseEntity<List<RegressionResult>> getAllRegressionResults() {
        try {
            List<RegressionResult> results = regressionService.getAllRegressionResults();
            return ResponseEntity.ok(results);
        } catch (Exception e) {
            log.error("Error fetching regression results", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<RegressionResult> getRegressionResult(@PathVariable String id) {
        try {
            return regressionService.getRegressionResultById(id)
                    .map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            log.error("Error fetching regression result with id: {}", id, e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/monthly-data")
    public ResponseEntity<List<MonthlyData>> getMonthlyData(
            @RequestParam String vehicleType,
            @RequestParam String year,
            @RequestParam(required = false) String region) {
        try {
            log.info("Fetching monthly data for type: {}, year: {}, region: {}", vehicleType, year, region);
            List<VehicleRecord> records = vehicleService.getRecordsByTypeAndYear(vehicleType, year);
            if (region != null) {
                records = records.stream()
                    .filter(r -> region.equals(r.getRegion()))
                    .toList();
            }
            List<MonthlyData> monthlyData = DataTransformUtils.transformToMonthlyData(records, vehicleType, year);
            return ResponseEntity.ok(monthlyData);
        } catch (Exception e) {
            log.error("Error fetching monthly data", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping("/analyze")
    public ResponseEntity<RegressionResult> analyzeConsumption(
            @RequestParam String vehicleType,
            @RequestParam String year,
            @RequestParam(required = false) String region) {
        
        try {
            log.info("Analyzing consumption for type: {}, year: {}, region: {}", vehicleType, year, region);
            
            // First check if analysis already exists
            Optional<RegressionResult> existingResult;
            if (region != null) {
                existingResult = regressionService.getRegressionResultByTypeAndYearAndRegion(vehicleType, year, region);
            } else {
                existingResult = regressionService.getRegressionResultByTypeAndYear(vehicleType, year);
            }
            
            if (existingResult.isPresent()) {
                return ResponseEntity.ok(existingResult.get());
            }
            
            // If no existing analysis, perform new one
            List<VehicleRecord> records = vehicleService.getRecordsByTypeAndYear(vehicleType, year);
            if (region != null) {
                records = records.stream()
                    .filter(r -> region.equals(r.getRegion()))
                    .toList();
            }
            
            if (records.isEmpty()) {
                log.warn("No data found for type: {} and year: {}", vehicleType, year);
                return ResponseEntity.badRequest().build();
            }
            
            List<MonthlyData> monthlyData = DataTransformUtils.transformToMonthlyData(records, vehicleType, year);
            
            // Perform validation before regression
            List<String> validationWarnings = validationService.validateData(monthlyData, vehicleType);
            
            // Perform regression analysis
            RegressionResult result = regressionService.performRegression(vehicleType, monthlyData);
            
            // Add validation results
            result.setWarnings(validationWarnings);
            result.setHasOutliers(validationWarnings.stream().anyMatch(w -> w.contains("outlier")));
            result.setHasMulticollinearity(validationWarnings.stream().anyMatch(w -> w.contains("correlation")));
            
            // Save result with metadata
            result.setYear(year);
            result.setVehicleType(vehicleType);
            result.setRegion(region);
            
            RegressionResult savedResult = regressionService.saveRegressionResult(result);
            log.info("Saved regression result with metadata - id: {}, year: {}, type: {}, region: {}", 
                savedResult.getId(), savedResult.getYear(), savedResult.getVehicleType(), savedResult.getRegion());
            
            return ResponseEntity.ok(savedResult);
        } catch (IllegalArgumentException e) {
            log.warn("Invalid request parameters", e);
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("Error performing regression analysis", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<RegressionResult> updateRegressionResult(
            @PathVariable String id,
            @RequestBody RegressionResult regressionResult) {
        
        try {
            if (!id.equals(regressionResult.getId())) {
                return ResponseEntity.badRequest().build();
            }

            RegressionResult updated = regressionService.saveRegressionResult(regressionResult);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            log.error("Error updating regression result with id: {}", id, e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRegressionResult(@PathVariable String id) {
        try {
            regressionService.deleteRegressionResult(id);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            log.error("Error deleting regression result with id: {}", id, e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping("/generate-sample")
    public ResponseEntity<List<RegressionResult>> generateSampleRegressions() {
        try {
            log.info("Generating sample regression equations for testing");
            
            List<RegressionResult> sampleResults = List.of(
                createSampleRegression("CAMION", "2025", "Tunis", 2.5, 0.08, 0.15),
                createSampleRegression("CAMION", "2025", "Sfax", 2.8, 0.09, 0.16),
                createSampleRegression("CAMION", "2024", "Tunis", 2.3, 0.07, 0.14),
                createSampleRegression("voitures", "2025", "Tunis", 3.2, 0.12, 0.0),
                createSampleRegression("voitures", "2025", "Sfax", 3.5, 0.13, 0.0),
                createSampleRegression("chariots", "2025", "Tunis", 4.1, 0.15, 0.0)
            );
            
            List<RegressionResult> savedResults = sampleResults.stream()
                .map(regressionService::saveRegressionResult)
                .toList();
            
            log.info("Generated {} sample regression equations", savedResults.size());
            return ResponseEntity.ok(savedResults);
        } catch (Exception e) {
            log.error("Error generating sample regression equations", e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    private RegressionResult createSampleRegression(String vehicleType, String year, String region, 
                                                   double intercept, double kmCoeff, double tonnageCoeff) {
        RegressionResult result = new RegressionResult();
        result.setVehicleType(vehicleType);
        result.setYear(year);
        result.setRegion(region);
        result.setIntercept(intercept);
        
        RegressionCoefficients coefficients = new RegressionCoefficients();
        coefficients.setKilometrage(kmCoeff);
        coefficients.setTonnage(tonnageCoeff);
        result.setCoefficients(coefficients);
        
        result.setRSquared(0.85); // Sample R-squared value
        result.setHasOutliers(false);
        result.setHasMulticollinearity(false);
        
        return result;
    }
}
