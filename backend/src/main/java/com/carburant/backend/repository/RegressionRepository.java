package com.carburant.backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import com.carburant.backend.model.RegressionResult;

@Repository
public interface RegressionRepository extends MongoRepository<RegressionResult, String> {
    Optional<RegressionResult> findByType(String type);
    List<RegressionResult> findAllByType(String type);
    
    // Find by type and year
    Optional<RegressionResult> findByTypeAndYear(String type, String year);
    
    // Find by type, year and region
    Optional<RegressionResult> findByTypeAndYearAndRegion(String type, String year, String region);
    
    // Find all by year
    List<RegressionResult> findAllByYear(String year);
    
    // Find all by type and year
    List<RegressionResult> findAllByTypeAndYear(String type, String year);
    
    // Find all by type and region
    List<RegressionResult> findAllByTypeAndRegion(String type, String region);
    
    // Delete by type and year
    void deleteByTypeAndYear(String type, String year);
    
    // Delete by type, year and region
    void deleteByTypeAndYearAndRegion(String type, String year, String region);
}
