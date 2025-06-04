package com.carburant.backend.service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.carburant.backend.model.Notification;
import com.carburant.backend.model.RegressionResult;
import com.carburant.backend.repository.NotificationRepository;

@Service
@Transactional
public class NotificationService {

    private final NotificationRepository notificationRepository;

    public NotificationService(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    public Notification createIpeViolationNotification(
            String vehicleId,
            String vehicleType,
            String region,
            String year,
            double ipeValue,
            double ipeTonneValue,
            double predictedValue,
            RegressionResult regressionResult
    ) {
        String title = "Anomalie IPE détectée";
        String message = String.format(
            "Valeurs anormales détectées pour le véhicule %s (%s) en %s. IPE: %.2f L/100km, IPE Tonne: %.2f L/100km.Tonne. Valeur prédite par régression: %.2f L/100km.Tonne",
            vehicleId, vehicleType, year, ipeValue, ipeTonneValue, predictedValue
        );

        Map<String, Object> metadata = new HashMap<>();
        metadata.put("ipeValue", ipeValue);
        metadata.put("ipeTonneValue", ipeTonneValue);
        metadata.put("predictedValue", predictedValue);
        metadata.put("regressionEquation", regressionResult.getRegressionEquation());
        metadata.put("rSquared", regressionResult.getRSquared());

        Notification notification = Notification.builder()
            .id(UUID.randomUUID().toString())
            .title(title)
            .message(message)
            .type(Notification.NotificationType.ANOMALY)
            .severity(Notification.NotificationSeverity.HIGH)
            .timestamp(LocalDateTime.now())
            .read(false)
            .vehicleId(vehicleId)
            .vehicleType(vehicleType)
            .region(region)
            .year(year)
            .metadata(metadata)
            .build();

        return notificationRepository.save(notification);
    }

    public List<Notification> getAllNotifications() {
        return notificationRepository.findAllOrderByTimestampDesc();
    }

    public List<Notification> getUnreadNotifications() {
        return notificationRepository.findByReadOrderByTimestampDesc(false);
    }

    public long getUnreadCount() {
        return notificationRepository.countUnread();
    }

    public Notification markAsRead(String id) {
        Notification notification = notificationRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Notification not found"));
        notification.setRead(true);
        return notificationRepository.save(notification);
    }

    public void markAllAsRead() {
        List<Notification> unreadNotifications = notificationRepository.findByReadOrderByTimestampDesc(false);
        unreadNotifications.forEach(notification -> notification.setRead(true));
        notificationRepository.saveAll(unreadNotifications);
    }

    public void deleteNotification(String id) {
        notificationRepository.deleteById(id);
    }

    public Notification createNotification(
            String title,
            String message,
            String type,
            String severity,
            String vehicleId,
            String vehicleType,
            String region,
            String year,
            Map<String, Object> metadata
    ) {
        Notification notification = Notification.builder()
            .id(UUID.randomUUID().toString())
            .title(title)
            .message(message)
            .type(Notification.NotificationType.valueOf(type))
            .severity(Notification.NotificationSeverity.valueOf(severity))
            .timestamp(LocalDateTime.now())
            .read(false)
            .vehicleId(vehicleId)
            .vehicleType(vehicleType)
            .region(region)
            .year(year)
            .metadata(metadata)
            .build();

        return notificationRepository.save(notification);
    }

    public List<Notification> getNotificationsByVehicle(String vehicleId) {
        return notificationRepository.findByVehicleIdOrderByTimestampDesc(vehicleId);
    }

    public List<Notification> getNotificationsByType(Notification.NotificationType type) {
        return notificationRepository.findByTypeOrderByTimestampDesc(type);
    }

    public Notification save(Notification notification) {
        return notificationRepository.save(notification);
    }
}
