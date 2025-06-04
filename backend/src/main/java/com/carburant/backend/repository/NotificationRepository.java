package com.carburant.backend.repository;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import com.carburant.backend.model.Notification;

@Repository
public interface NotificationRepository extends MongoRepository<Notification, String> {
    
    List<Notification> findByReadOrderByTimestampDesc(boolean read);
    
    @Query(value = "{ 'read': false }", count = true)
    long countUnread();
    
    List<Notification> findByVehicleIdOrderByTimestampDesc(String vehicleId);
    
    List<Notification> findByVehicleTypeOrderByTimestampDesc(String vehicleType);
    
    List<Notification> findByTypeOrderByTimestampDesc(Notification.NotificationType type);
    
    @Query(value = "{}", sort = "{ 'timestamp': -1 }")
    List<Notification> findAllOrderByTimestampDesc();
}
