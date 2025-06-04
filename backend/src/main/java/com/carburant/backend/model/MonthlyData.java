package com.carburant.backend.model;

import java.util.List;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class MonthlyData {
    private String month;
    private String year;
    private String region;
    private double kilometrage;
    private double consommation;
    private double tonnage;
    private double referenceConsommation;
    private double targetConsommation;
    private double improvementPercentage;

    public static MonthlyData fromVehicleRecords(List<VehicleRecord> records) {
        if (records == null || records.isEmpty()) {
            throw new IllegalArgumentException("Records cannot be null or empty");
        }

        VehicleRecord firstRecord = records.get(0);
        String month = firstRecord.getMois();
        String year = firstRecord.getYear() != null ? firstRecord.getYear().toString() : 
                     String.valueOf(java.time.Year.now().getValue());
        String region = firstRecord.getRegion();

        double totalKm = records.stream()
            .mapToDouble(VehicleRecord::getKilometrage)
            .sum();

        double totalConsommation = records.stream()
            .mapToDouble(VehicleRecord::getConsommationL)
            .sum();

        double totalTonnes = records.stream()
            .map(VehicleRecord::getProduitsTonnes)
            .filter(tonnes -> tonnes != null)
            .mapToDouble(Double::doubleValue)
            .sum();

        // Calculate reference consumption based on IPE
        double referenceConsommation = records.stream()
            .mapToDouble(r -> r.getIpeL100km() * (r.getKilometrage() / 100))
            .sum();

        // Target consumption is 5% less than reference
        double targetConsommation = referenceConsommation * 0.95;

        // Calculate improvement percentage
        double improvementPercentage = ((referenceConsommation - totalConsommation) / referenceConsommation) * 100;

        return MonthlyData.builder()
            .month(month)
            .year(year)
            .region(region)
            .kilometrage(totalKm)
            .consommation(totalConsommation)
            .tonnage(totalTonnes)
            .referenceConsommation(referenceConsommation)
            .targetConsommation(targetConsommation)
            .improvementPercentage(improvementPercentage)
            .build();
    }
}
