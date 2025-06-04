package com.carburant.backend.controller;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.carburant.backend.model.VehicleRecord;
import com.carburant.backend.service.VehicleService;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/config")
@CrossOrigin(origins = "*")
public class ConfigController {

    private final VehicleService vehicleService;

    public ConfigController(VehicleService vehicleService) {
        this.vehicleService = vehicleService;
    }

    @GetMapping("/vehicle-types")
    public ResponseEntity<Map<String, Object>> getVehicleTypes() {
        try {
            // Get distinct vehicle types from the database
            List<String> vehicleTypes = vehicleService.getCachedSheetNames();
            List<String> regions = List.of("Tunis", "MJEZ ELBEB");

            // Return the configuration data
            Map<String, Object> config = Map.of(
                "vehicleTypes", vehicleTypes,
                "regions", regions
            );
            
            return ResponseEntity.ok(config);
        } catch (Exception e) {
            log.error("Error fetching vehicle configuration", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/vehicles")
    public ResponseEntity<List<Map<String, String>>> getVehicles() {
        try {
            List<VehicleRecord> records = vehicleService.getAllRecords();
            
            // Create a map to store unique vehicles with their types and regions
            Map<String, Map<String, String>> uniqueVehicles = new HashMap<>();
            
            for (VehicleRecord record : records) {
                String matricule = record.getMatricule();
                if (matricule != null && !matricule.trim().isEmpty() && !uniqueVehicles.containsKey(matricule)) {
                    Map<String, String> vehicleInfo = new HashMap<>();
                    vehicleInfo.put("matricule", matricule);
                    vehicleInfo.put("type", record.getType() != null ? record.getType() : "camions");
                    vehicleInfo.put("region", record.getRegion() != null ? record.getRegion() : "Tunis");
                    uniqueVehicles.put(matricule, vehicleInfo);
                }
            }
            
            // If no vehicles found in database, return empty list (not an error)
            if (uniqueVehicles.isEmpty()) {
                log.info("No vehicles found in database, returning empty list");
                return ResponseEntity.ok(new ArrayList<>());
            }
            
            log.info("Found {} unique vehicles in database", uniqueVehicles.size());
            return ResponseEntity.ok(new ArrayList<>(uniqueVehicles.values()));
        } catch (Exception e) {
            log.error("Error fetching vehicles from database", e);
            // Return empty list instead of error to allow frontend to continue
            return ResponseEntity.ok(new ArrayList<>());
        }
    }
}
