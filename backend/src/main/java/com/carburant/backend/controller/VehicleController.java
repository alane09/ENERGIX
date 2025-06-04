package com.carburant.backend.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.carburant.backend.model.VehicleRecord;
import com.carburant.backend.service.SERService;
import com.carburant.backend.service.VehicleService;

@RestController
@RequestMapping("/records")
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
public class VehicleController {

    private final VehicleService vehicleService;
    private final SERService serService;
    private static final Logger logger = LoggerFactory.getLogger(VehicleController.class);
    private final Map<String, Long> lastRequestTime = new ConcurrentHashMap<>();
    private final Map<String, Integer> requestCount = new ConcurrentHashMap<>();
    private static final long RATE_LIMIT_WINDOW = 5000;
    private static final int MAX_REQUESTS_PER_WINDOW = 10;

    @Autowired
    public VehicleController(VehicleService vehicleService, SERService serService) {
        this.vehicleService = vehicleService;
        this.serService = serService;
    }

    private boolean isRateLimited(String endpoint) {
        long currentTime = System.currentTimeMillis();
        Long lastTime = lastRequestTime.get(endpoint);
        
        if (lastTime == null || currentTime - lastTime >= RATE_LIMIT_WINDOW) {
            lastRequestTime.put(endpoint, currentTime);
            requestCount.put(endpoint, 1);
            return false;
        }
        
        int count = requestCount.getOrDefault(endpoint, 0) + 1;
        requestCount.put(endpoint, count);
        
        if (count > MAX_REQUESTS_PER_WINDOW) {
            logger.warn("Rate limit exceeded for endpoint: {} - {} requests in {} ms", 
                      endpoint, count, RATE_LIMIT_WINDOW);
            return true;
        }
        
        return false;
    }

    @GetMapping
    public ResponseEntity<List<VehicleRecord>> getRecords(
            @RequestParam(value = "type", required = false) String type,
            @RequestParam(value = "mois", required = false) String mois,
            @RequestParam(value = "matricule", required = false) String matricule,
            @RequestParam(value = "year", required = false) String year) {
        
        if (isRateLimited("getRecords")) {
            return ResponseEntity.status(429).build();
        }
        
        logger.info("Filtering records - type: {}, mois: {}, matricule: {}, year: {}", 
                    type, mois, matricule, year);
        
        List<VehicleRecord> filteredRecords;
        
        try {
            Thread.sleep(50);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
        
        // Apply filters based on parameters
        if (type != null && !type.isEmpty() && 
            year != null && !year.isEmpty() && 
            mois != null && !mois.isEmpty() && 
            matricule != null && !matricule.isEmpty()) {
            filteredRecords = vehicleService.getRecordsByTypeAndMatriculeAndYearAndMois(type, matricule, year, mois);
        }
        else if (type != null && !type.isEmpty() && 
                 year != null && !year.isEmpty() && 
                 matricule != null && !matricule.isEmpty()) {
            filteredRecords = vehicleService.getRecordsByTypeMatriculeAndYear(type, matricule, year);
        }
        else if (type != null && !type.isEmpty() && 
                 year != null && !year.isEmpty() && 
                 mois != null && !mois.isEmpty()) {
            filteredRecords = vehicleService.getRecordsByTypeYearAndMonth(type, year, mois);
        }
        else if (matricule != null && !matricule.isEmpty() && 
                 year != null && !year.isEmpty() && 
                 mois != null && !mois.isEmpty()) {
            filteredRecords = vehicleService.getRecordsByMatriculeAndYearAndMois(matricule, year, mois);
        }
        else if (type != null && !type.isEmpty() && 
                 matricule != null && !matricule.isEmpty()) {
            filteredRecords = vehicleService.getRecordsByTypeAndMatricule(type, matricule);
        }
        else if (type != null && !type.isEmpty() && 
                 year != null && !year.isEmpty()) {
            filteredRecords = vehicleService.getRecordsByTypeAndYear(type, year);
        }
        else if (matricule != null && !matricule.isEmpty() && 
                 year != null && !year.isEmpty()) {
            filteredRecords = vehicleService.getRecordsByMatriculeAndYear(matricule, year);
        }
        else if (year != null && !year.isEmpty() && 
                 mois != null && !mois.isEmpty()) {
            filteredRecords = vehicleService.getRecordsByYearAndMois(year, mois);
        }
        else if (year != null && !year.isEmpty()) {
            filteredRecords = vehicleService.getRecordsByYear(year);
        }
        else if (matricule != null && !matricule.isEmpty()) {
            filteredRecords = vehicleService.getRecordsByMatricule(matricule);
        }
        else if (type != null && !type.isEmpty() && 
                 mois != null && !mois.isEmpty()) {
            filteredRecords = vehicleService.getRecordsByTypeAndMonth(type, mois);
        }
        else if (type != null && !type.isEmpty()) {
            filteredRecords = vehicleService.getRecordsByType(type);
        }
        else if (mois != null && !mois.isEmpty()) {
            filteredRecords = vehicleService.getRecordsByMonth(mois);
        }
        else {
            logger.info("No filter parameters provided, returning all records");
            filteredRecords = vehicleService.getAllRecords();
        }
        
        // Add IPE_SER values for all vehicle types
        filteredRecords.forEach(record -> {
            try {
                // Get regression equation for the specific year, region, and type
                var serEquation = serService.getSEREquation(
                    record.getRegion(), 
                    record.getYear(), 
                    record.getType()
                );
                
                if (serEquation.isPresent()) {
                    var equation = serEquation.get();
                    
                    if (record.isCamion()) {
                        // For trucks, calculate both IPE_SER values
                        if (record.getKilometrage() > 0 && record.getProduitsTonnes() > 0) {
                            // Calculate reference consumption using SER equation
                            double referenceConsumption = equation.getIntercept() + 
                                (equation.getCoefficients().getKilometrage() * record.getKilometrage()) +
                                (equation.getCoefficients().getTonnage() * record.getProduitsTonnes());
                            
                            // IPE_SER in L/100km = (Reference Consumption / Distance) × 100
                            double ipeSerL100km = (referenceConsumption / record.getKilometrage()) * 100;
                            record.setIpeSerL100km(ipeSerL100km);
                            
                            // IPE_SER in L/100km·T = IPE_SER / Tonnage
                            double ipeSerL100kmT = ipeSerL100km / record.getProduitsTonnes();
                            record.setIpeSerL100TonneKm(ipeSerL100kmT);
                            
                            // Keep predictedIpe for backward compatibility (L/100km·T for trucks)
                            record.setPredictedIpe(ipeSerL100kmT);
                            
                            logger.debug("Set truck IPE_SER for {}: {} L/100km, {} L/100km·T (Ref consumption: {} L)", 
                                record.getMatricule(), ipeSerL100km, ipeSerL100kmT, referenceConsumption);
                        } else {
                            logger.debug("Skipping IPE_SER calculation for truck {} - invalid kilometrage ({}) or tonnage ({})",
                                record.getMatricule(), record.getKilometrage(), record.getProduitsTonnes());
                        }
                    } else {
                        // For other vehicles, calculate IPE_SER in L/100km only
                        if (record.getKilometrage() > 0) {
                            // Calculate reference consumption using SER equation (no tonnage component)
                            double referenceConsumption = equation.getIntercept() + 
                                (equation.getCoefficients().getKilometrage() * record.getKilometrage());
                            
                            // IPE_SER in L/100km = (Reference Consumption / Distance) × 100
                            double ipeSerL100km = (referenceConsumption / record.getKilometrage()) * 100;
                            record.setIpeSerL100km(ipeSerL100km);
                            record.setPredictedIpe(ipeSerL100km);
                            
                            logger.debug("Set vehicle IPE_SER for {}: {} L/100km (Ref consumption: {} L)", 
                                record.getMatricule(), ipeSerL100km, referenceConsumption);
                        } else {
                            logger.debug("Skipping IPE_SER calculation for vehicle {} - invalid kilometrage ({})",
                                record.getMatricule(), record.getKilometrage());
                        }
                    }
                } else {
                    logger.debug("No regression equation found for record: type={}, region={}, year={}", 
                        record.getType(), record.getRegion(), record.getYear());
                }
            } catch (Exception e) {
                logger.warn("Error calculating IPE_SER for record {}: {}", record.getId(), e.getMessage());
            }
        });
        
        return ResponseEntity.ok(filteredRecords);
    }

    @GetMapping("/monthly-aggregation")
    public ResponseEntity<List<Map<String, Object>>> getMonthlyAggregatedData(
            @RequestParam(value = "vehicleType", required = false) String vehicleType,
            @RequestParam(value = "year", required = false) String year,
            @RequestParam(value = "dateFrom", required = false) String dateFrom,
            @RequestParam(value = "dateTo", required = false) String dateTo) {
        
        if (isRateLimited("getMonthlyAggregatedData")) {
            return ResponseEntity.status(429).build();
        }
        
        logger.info("Getting monthly aggregation - vehicleType: {}, year: {}, dateFrom: {}, dateTo: {}", 
                    vehicleType, year, dateFrom, dateTo);
        
        try {
            List<Map<String, Object>> aggregatedData = vehicleService.getMonthlyAggregatedData(
                vehicleType != null && !vehicleType.equals("all") ? vehicleType : null,
                year,
                dateFrom,
                dateTo
            );
            
            return ResponseEntity.ok(aggregatedData != null ? aggregatedData : List.of());
        } catch (Exception e) {
            logger.error("Error getting monthly aggregation data", e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    @GetMapping("/performance")
    public ResponseEntity<List<Map<String, Object>>> getVehiclePerformanceData(
            @RequestParam("type") String type,
            @RequestParam(value = "includeSheetData", required = false, defaultValue = "false") boolean includeSheetData) {
        
        if ("all".equalsIgnoreCase(type) && includeSheetData) {
            List<Map<String, Object>> allData = vehicleService.getVehiclePerformanceData("all");
            return ResponseEntity.ok(allData);
        }
        
        return ResponseEntity.ok(vehicleService.getVehiclePerformanceData(type));
    }

    @GetMapping("/{id}")
    public ResponseEntity<VehicleRecord> getRecordById(@PathVariable String id) {
        return vehicleService.getRecordById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<VehicleRecord> createRecord(@RequestBody VehicleRecord record) {
        return ResponseEntity.ok(vehicleService.saveRecord(record));
    }

    @PutMapping("/{id}")
    public ResponseEntity<VehicleRecord> updateRecord(
            @PathVariable String id,
            @RequestBody VehicleRecord record) {
        try {
            return ResponseEntity.ok(vehicleService.updateRecord(id, record));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PatchMapping("/{id}")
    public ResponseEntity<VehicleRecord> partialUpdateRecord(
            @PathVariable String id,
            @RequestBody VehicleRecord record) {
        try {
            return vehicleService.getRecordById(id)
                    .map(existingRecord -> {
                        if (record.getType() != null) {
                            existingRecord.setType(record.getType());
                        }
                        if (record.getMois() != null) {
                            existingRecord.setMois(record.getMois());
                        }
                        if (record.getMatricule() != null) {
                            existingRecord.setMatricule(record.getMatricule());
                        }
                        if (record.getRawValues() != null) {
                            existingRecord.setRawValues(record.getRawValues());
                        }
                        
                        existingRecord.setConsommationL(record.getConsommationL());
                        existingRecord.setConsommationTEP(record.getConsommationTEP());
                        existingRecord.setCoutDT(record.getCoutDT());
                        existingRecord.setKilometrage(record.getKilometrage());
                        existingRecord.setProduitsTonnes(record.getProduitsTonnes());
                        existingRecord.setIpeL100km(record.getIpeL100km());
                        existingRecord.setIpeL100TonneKm(record.getIpeL100TonneKm());
                        
                        return ResponseEntity.ok(vehicleService.saveRecord(existingRecord));
                    })
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRecord(@PathVariable String id) {
        if (vehicleService.getRecordById(id).isPresent()) {
            vehicleService.deleteRecord(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }

    @PostMapping("/scan-anomalies")
    public ResponseEntity<Map<String, Object>> scanForAnomalies() {
        if (isRateLimited("scanForAnomalies")) {
            return ResponseEntity.status(429).build();
        }
        
        logger.info("Starting comprehensive anomaly scan");
        int anomaliesFound = vehicleService.scanAllRecordsForAnomalies();
        
        Map<String, Object> response = new HashMap<>();
        response.put("anomaliesFound", anomaliesFound);
        response.put("message", String.format("Scan completed. Found %d anomalies.", anomaliesFound));
        
        logger.info("Anomaly scan completed. Found {} anomalies", anomaliesFound);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/anomalies/count")
    public ResponseEntity<Map<String, Object>> getAnomalyCount() {
        if (isRateLimited("getAnomalyCount")) {
            return ResponseEntity.status(429).build();
        }
        
        long count = vehicleService.getAnomalyCount();
        Map<String, Object> response = new HashMap<>();
        response.put("count", count);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/anomalies")
    public ResponseEntity<List<VehicleRecord>> getAnomalousRecords() {
        if (isRateLimited("getAnomalousRecords")) {
            return ResponseEntity.status(429).build();
        }
        
        List<VehicleRecord> anomalies = vehicleService.getAllAnomalousRecords();
        return ResponseEntity.ok(anomalies);
    }
}
