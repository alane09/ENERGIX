package com.carburant.backend.controller;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.carburant.backend.model.VehicleRecord;
import com.carburant.backend.repository.VehicleRepository;

@RestController
@RequestMapping("/test")
public class TestController {

    @Autowired
    private MongoTemplate mongoTemplate;

    @Autowired
    private VehicleRepository vehicleRepository;

    @GetMapping("/db-stats")
    public ResponseEntity<Map<String, Object>> getDbStats() {
        // Get collection stats
        long count = mongoTemplate.getCollection("vehicle_records").countDocuments();
        List<VehicleRecord> records = vehicleRepository.findAll();
        
        return ResponseEntity.ok(Map.of(
            "collection_count", count,
            "repository_count", records.size(),
            "sample_record", records.isEmpty() ? null : records.get(0)
        ));
    }
}
