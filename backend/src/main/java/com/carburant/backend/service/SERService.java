package com.carburant.backend.service;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;

import com.carburant.backend.model.RegressionResult;
import com.carburant.backend.model.VehicleRecord;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class SERService {
    
    private final MongoTemplate mongoTemplate;
    private final RegressionService regressionService;
    
    @Autowired
    public SERService(MongoTemplate mongoTemplate, RegressionService regressionService) {
        this.mongoTemplate = mongoTemplate;
        this.regressionService = regressionService;
    }
    
    /**
     * Get SER equation for a specific region, year, and vehicle type with fallback logic
     */
    public Optional<RegressionResult> getSEREquation(String region, String year, String vehicleType) {
        try {
            int currentYear = Integer.parseInt(year);
            
            // Try current year and previous years (fallback logic)
            for (int fallbackYear = currentYear; fallbackYear >= currentYear - 5; fallbackYear--) {
                String yearStr = String.valueOf(fallbackYear);
                
                Query query = new Query();
                
                // First try with region, year, and vehicleType (future structure)
                if (region != null && !region.isEmpty()) {
                    query.addCriteria(Criteria.where("region").is(region)
                            .and("year").is(yearStr)
                            .and("vehicleType").is(vehicleType));
                    
                    RegressionResult result = mongoTemplate.findOne(query, RegressionResult.class, "regression_results");
                    if (result != null) {
                        log.debug("Found region-specific regression equation for vehicleType: {}, year: {}, region: {}", vehicleType, yearStr, region);
                        return Optional.of(result);
                    }
                }
                
                // Fallback: try with year and vehicleType only (current structure)
                query = new Query();
                query.addCriteria(Criteria.where("year").is(yearStr)
                        .and("vehicleType").is(vehicleType));
                
                RegressionResult result = mongoTemplate.findOne(query, RegressionResult.class, "regression_results");
                if (result != null) {
                    log.debug("Found general regression equation for vehicleType: {}, year: {}", vehicleType, yearStr);
                    return Optional.of(result);
                }
                
                // Try with "type" field instead of "vehicleType" (alternative naming)
                query = new Query();
                query.addCriteria(Criteria.where("year").is(yearStr)
                        .and("type").is(vehicleType));
                
                result = mongoTemplate.findOne(query, RegressionResult.class, "regression_results");
                if (result != null) {
                    log.debug("Found regression equation using 'type' field for vehicleType: {}, year: {}", vehicleType, yearStr);
                    return Optional.of(result);
                }
            }
            
            log.warn("No regression equation found for vehicleType: {}, year: {}, region: {} after fallback", vehicleType, year, region);
            return Optional.empty();
            
        } catch (NumberFormatException e) {
            log.error("Invalid year format: {}", year);
            return Optional.empty();
        }
    }
    
    /**
     * Get SER equation with information about which year was actually used
     */
    public Optional<RegressionResultWithYear> getSEREquationWithFallbackInfo(String region, String year, String vehicleType) {
        try {
            int currentYear = Integer.parseInt(year);
            
            // Try current year and previous years (fallback logic)
            for (int fallbackYear = currentYear; fallbackYear >= currentYear - 5; fallbackYear--) {
                String yearStr = String.valueOf(fallbackYear);
                
                Query query = new Query();
                
                // First try with region, year, and vehicleType (future structure)
                if (region != null && !region.isEmpty()) {
                    query.addCriteria(Criteria.where("region").is(region)
                            .and("year").is(yearStr)
                            .and("vehicleType").is(vehicleType));
                    
                    RegressionResult result = mongoTemplate.findOne(query, RegressionResult.class, "regression_results");
                    if (result != null) {
                        log.debug("Found region-specific regression equation for vehicleType: {}, year: {}, region: {}", vehicleType, yearStr, region);
                        return Optional.of(new RegressionResultWithYear(result, yearStr));
                    }
                }
                
                // Fallback: try with year and vehicleType only (current structure)
                query = new Query();
                query.addCriteria(Criteria.where("year").is(yearStr)
                        .and("vehicleType").is(vehicleType));
                
                RegressionResult result = mongoTemplate.findOne(query, RegressionResult.class, "regression_results");
                if (result != null) {
                    log.debug("Found general regression equation for vehicleType: {}, year: {}", vehicleType, yearStr);
                    return Optional.of(new RegressionResultWithYear(result, yearStr));
                }
                
                // Try with "type" field instead of "vehicleType" (alternative naming)
                query = new Query();
                query.addCriteria(Criteria.where("year").is(yearStr)
                        .and("type").is(vehicleType));
                
                result = mongoTemplate.findOne(query, RegressionResult.class, "regression_results");
                if (result != null) {
                    log.debug("Found regression equation using 'type' field for vehicleType: {}, year: {}", vehicleType, yearStr);
                    return Optional.of(new RegressionResultWithYear(result, yearStr));
                }
            }
            
            log.warn("No regression equation found for vehicleType: {}, year: {}, region: {} after fallback", vehicleType, year, region);
            return Optional.empty();
            
        } catch (NumberFormatException e) {
            log.error("Invalid year format: {}", year);
            return Optional.empty();
        }
    }
    
    /**
     * Inner class to hold regression result with the year that was actually used
     */
    public static class RegressionResultWithYear {
        private final RegressionResult regressionResult;
        private final String usedYear;
        
        public RegressionResultWithYear(RegressionResult regressionResult, String usedYear) {
            this.regressionResult = regressionResult;
            this.usedYear = usedYear;
        }
        
        public RegressionResult getRegressionResult() {
            return regressionResult;
        }
        
        public String getUsedYear() {
            return usedYear;
        }
    }
    
    /**
     * Calculate IPE_SER L/100km using regression equation for reference consumption
     */
    public double calculateIPE_SER_L100km(VehicleRecord record) {
        // Get regression equation for the specific year, region, and type
        Optional<RegressionResult> serEquation = getSEREquation(
            record.getRegion(), 
            record.getYear(), 
            record.getType()
        );
        
        if (!serEquation.isPresent()) {
            log.warn("No regression equation found for region: {}, year: {}, type: {}", 
                    record.getRegion(), record.getYear(), record.getType());
            return 0.0;
        }

        RegressionResult equation = serEquation.get();
        
        // Calculate reference consumption using regression equation
        double referenceConsumption = equation.getIntercept() + 
            (equation.getCoefficients().getKilometrage() * record.getKilometrage()) + 
            (equation.getCoefficients().getTonnage() * record.getProduitsTonnes());
        
        // Calculate IPE_SER L/100km using reference consumption
        if (record.getKilometrage() > 0) {
            return (referenceConsumption / record.getKilometrage()) * 100;
        }
        
        log.warn("Invalid kilometrage value for vehicle: {}", record.getMatricule());
        return 0.0;
    }

    /**
     * Calculate IPE_SER using regression equation for reference consumption
     * and actual tonnage/kilometrage values (L/100km·T)
     */
    public double calculateIPE_SER(VehicleRecord record) {
        // Only calculate for trucks
        if (!"CAMION".equalsIgnoreCase(record.getType()) && !"camions".equalsIgnoreCase(record.getType())) {
            log.warn("IPE_SER calculation requested for non-truck vehicle type: {}", record.getType());
            return 0.0;
        }

        // Get regression equation for the specific year, region, and type
        Optional<RegressionResult> serEquation = getSEREquation(
            record.getRegion(), 
            record.getYear(), 
            record.getType()
        );
        
        if (!serEquation.isPresent()) {
            log.warn("No regression equation found for region: {}, year: {}, type: {}", 
                    record.getRegion(), record.getYear(), record.getType());
            return 0.0;
        }

        RegressionResult equation = serEquation.get();
        
        // Calculate reference consumption using regression equation
        double referenceConsumption = equation.getIntercept() + 
            (equation.getCoefficients().getKilometrage() * record.getKilometrage()) + 
            (equation.getCoefficients().getTonnage() * record.getProduitsTonnes());
        
        // Calculate IPE_SER using reference consumption and actual values
        if (record.getKilometrage() > 0 && record.getProduitsTonnes() > 0) {
            // Convert to L/100km.Tonne
            double ipeL100km = (referenceConsumption / record.getKilometrage()) * 100;
            return ipeL100km / record.getProduitsTonnes();
        }
        
        log.warn("Invalid kilometrage or tonnage values for vehicle: {}", record.getMatricule());
        return 0.0;
    }
    
    /**
     * Check if actual IPE exceeds IPE_SER
     */
    public boolean exceedsSERLimits(VehicleRecord record) {
        // Only check for trucks
        if (!"CAMION".equalsIgnoreCase(record.getType()) && !"camions".equalsIgnoreCase(record.getType())) {
            return false;
        }

        double ipe_ser = calculateIPE_SER(record);
        if (ipe_ser <= 0.0) {
            log.warn("Could not calculate IPE_SER for vehicle: {}", record.getMatricule());
            return false;
        }

        return record.getIpeL100TonneKm() > ipe_ser;
    }
    
    /**
     * Get all available SER equations
     */
    public List<RegressionResult> getAllSEREquations() {
        return mongoTemplate.findAll(RegressionResult.class, "regression_results");
    }
    
    /**
     * Save or update SER equation
     */
    public RegressionResult saveSEREquation(RegressionResult equation) {
        return regressionService.saveRegressionResult(equation);
    }
}
