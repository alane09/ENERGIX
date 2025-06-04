package com.carburant.backend.repository;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import com.carburant.backend.model.RegressionResult;

@Repository
public interface RegressionResultRepository extends MongoRepository<RegressionResult, String> {
    
    List<RegressionResult> findByVehicleType(String vehicleType);
    
    List<RegressionResult> findByYear(String year);
    
    @Query("{ 'vehicleType': ?0, 'year': ?1 }")
    List<RegressionResult> findByVehicleTypeAndYear(String vehicleType, String year);
    
    @Query(value = "{ 'vehicleType': ?0 }", sort = "{ 'timestamp': -1 }")
    List<RegressionResult> findByVehicleTypeOrderByTimestampDesc(String vehicleType);
}
