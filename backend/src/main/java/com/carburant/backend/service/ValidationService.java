package com.carburant.backend.service;

import java.util.ArrayList;
import java.util.List;

import org.apache.commons.math3.stat.correlation.PearsonsCorrelation;
import org.apache.commons.math3.stat.descriptive.DescriptiveStatistics;
import org.springframework.stereotype.Service;

import com.carburant.backend.model.MonthlyData;

@Service
public class ValidationService {
    
    private static final double OUTLIER_THRESHOLD = 2.0; // Z-score threshold for outliers
    private static final double MULTICOLLINEARITY_THRESHOLD = 0.9; // Correlation threshold
    private static final double MIN_KILOMETRAGE = 0.0;
    private static final double MAX_KILOMETRAGE = 500000.0;
    private static final double MIN_CONSOMMATION = 0.0;
    private static final double MAX_CONSOMMATION = 50000.0;
    private static final double MIN_TONNAGE = 0.0;
    private static final double MAX_TONNAGE = 500000.0;

    public List<String> validateData(List<MonthlyData> monthlyData, String type) {
        List<String> warnings = new ArrayList<>();
        
        if (monthlyData == null || monthlyData.isEmpty()) {
            throw new IllegalArgumentException("Monthly data cannot be null or empty");
        }

        // Basic range validations
        validateRanges(monthlyData, warnings);

        // Outlier detection
        detectOutliers(monthlyData, warnings);

        // Multicollinearity check for truck data
        if ("CAMION".equals(type)) {
            checkMulticollinearity(monthlyData, warnings);
        }

        return warnings;
    }

    private void validateRanges(List<MonthlyData> monthlyData, List<String> warnings) {
        for (MonthlyData data : monthlyData) {
            if (data.getKilometrage() < MIN_KILOMETRAGE || data.getKilometrage() > MAX_KILOMETRAGE) {
                warnings.add(String.format("Warning: Kilometrage value %.2f for month %s is outside expected range",
                    data.getKilometrage(), data.getMonth()));
            }

            if (data.getConsommation() < MIN_CONSOMMATION || data.getConsommation() > MAX_CONSOMMATION) {
                warnings.add(String.format("Warning: Consumption value %.2f for month %s is outside expected range",
                    data.getConsommation(), data.getMonth()));
            }

            if (data.getTonnage() != 0 && (data.getTonnage() < MIN_TONNAGE || data.getTonnage() > MAX_TONNAGE)) {
                warnings.add(String.format("Warning: Tonnage value %.2f for month %s is outside expected range",
                    data.getTonnage(), data.getMonth()));
            }
        }
    }

    private void detectOutliers(List<MonthlyData> monthlyData, List<String> warnings) {
        DescriptiveStatistics consStats = new DescriptiveStatistics();
        DescriptiveStatistics kmStats = new DescriptiveStatistics();
        
        // Calculate z-scores
        monthlyData.forEach(data -> {
            consStats.addValue(data.getConsommation());
            kmStats.addValue(data.getKilometrage());
        });

        for (MonthlyData data : monthlyData) {
            double consZScore = (data.getConsommation() - consStats.getMean()) / consStats.getStandardDeviation();
            double kmZScore = (data.getKilometrage() - kmStats.getMean()) / kmStats.getStandardDeviation();

            if (Math.abs(consZScore) > OUTLIER_THRESHOLD) {
                warnings.add(String.format("Warning: Possible outlier detected - Consumption value %.2f for month %s (z-score: %.2f)",
                    data.getConsommation(), data.getMonth(), consZScore));
            }

            if (Math.abs(kmZScore) > OUTLIER_THRESHOLD) {
                warnings.add(String.format("Warning: Possible outlier detected - Kilometrage value %.2f for month %s (z-score: %.2f)",
                    data.getKilometrage(), data.getMonth(), kmZScore));
            }
        }
    }

    private void checkMulticollinearity(List<MonthlyData> monthlyData, List<String> warnings) {
        double[] kilometrage = monthlyData.stream().mapToDouble(MonthlyData::getKilometrage).toArray();
        double[] tonnage = monthlyData.stream().mapToDouble(MonthlyData::getTonnage).toArray();

        PearsonsCorrelation correlation = new PearsonsCorrelation();
        double corr = correlation.correlation(kilometrage, tonnage);

        if (Math.abs(corr) > MULTICOLLINEARITY_THRESHOLD) {
            warnings.add(String.format("Warning: High correlation (%.2f) detected between kilometrage and tonnage. " +
                "This may affect the reliability of the regression results.", corr));
        }
    }
}
