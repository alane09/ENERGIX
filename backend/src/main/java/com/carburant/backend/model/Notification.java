package com.carburant.backend.model;

import java.time.LocalDateTime;
import java.util.Map;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Document(collection = "notifications")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Notification {
    @Id
    private String id;
    
    private String title;
    private String message;
    private NotificationType type;
    private NotificationSeverity severity;
    
    @Indexed
    private LocalDateTime timestamp;
    
    @Indexed
    private boolean read;
    
    @Indexed
    private String vehicleId;
    
    @Indexed
    private String vehicleType;
    private String region;
    private String year;
    private Map<String, Object> metadata;

    public enum NotificationType {
        ANOMALY,
        WARNING,
        INFO
    }

    public enum NotificationSeverity {
        HIGH,
        MEDIUM,
        LOW
    }
}
