package com.carburant.backend.service;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

import org.apache.commons.math3.distribution.FDistribution;
import org.apache.commons.math3.distribution.TDistribution;
import org.apache.commons.math3.stat.regression.OLSMultipleLinearRegression;
import org.springframework.stereotype.Service;

import com.carburant.backend.model.MonthlyData;
import com.carburant.backend.model.RegressionCoefficients;
import com.carburant.backend.model.RegressionResult;
import com.carburant.backend.model.VehicleRecord;
import com.carburant.backend.repository.RegressionRepository;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class RegressionService {
    private final RegressionRepository regressionRepository;
    private final ValidationService validationService;

    public List<RegressionResult> getAllRegressionResults() {
        return regressionRepository.findAll();
    }

    public Optional<RegressionResult> getRegressionResultById(String id) {
        return regressionRepository.findById(id);
    }

    public Optional<RegressionResult> getRegressionResultByTypeAndYear(String type, String year) {
        return regressionRepository.findByTypeAndYear(type, year);
    }

    public Optional<RegressionResult> getRegressionResultByTypeAndYearAndRegion(String type, String year, String region) {
        return regressionRepository.findByTypeAndYearAndRegion(type, year, region);
    }

    public RegressionResult saveRegressionResult(RegressionResult result) {
        if (result.getId() == null) {
            result.setId(UUID.randomUUID().toString());
        }
        return regressionRepository.save(result);
    }

    public void deleteRegressionResult(String id) {
        regressionRepository.deleteById(id);
    }

    public void deleteRegressionResultByTypeAndYear(String type, String year) {
        regressionRepository.deleteByTypeAndYear(type, year);
    }

    public double predictIpeForRecord(List<VehicleRecord> historicalRecords, VehicleRecord currentRecord) {
        List<MonthlyData> monthlyData = historicalRecords.stream()
            .map(record -> MonthlyData.builder()
                .kilometrage(record.getKilometrage())
                .tonnage(record.getProduitsTonnes())
                .consommation(record.getConsommationL())
                .build())
            .collect(Collectors.toList());

        RegressionResult result = performRegression("CAMION", monthlyData);
        
        // Calculate predicted IPE using regression coefficients
        RegressionCoefficients coef = result.getCoefficients();
        double predictedConsumption = result.getIntercept() + 
            (coef.getKilometrage() * currentRecord.getKilometrage()) + 
            (coef.getTonnage() * currentRecord.getProduitsTonnes());
        
        // Convert predicted consumption to IPE/Tonne
        double predictedIpe = (predictedConsumption / currentRecord.getKilometrage()) * 100;
        if (currentRecord.getProduitsTonnes() > 0) {
            return predictedIpe / currentRecord.getProduitsTonnes();
        }
        return predictedIpe;
    }

    public RegressionResult performRegression(String type, List<MonthlyData> monthlyData) {
        // Validate input data
        List<String> warnings = validationService.validateData(monthlyData, type);
        
        RegressionResult result;
        if ("VOITURE".equals(type)) {
            result = performCarRegression(monthlyData);
        } else if ("CAMION".equals(type)) {
            result = performTruckRegression(monthlyData);
        } else {
            throw new IllegalArgumentException("Type de véhicule non supporté: " + type);
        }

        // Add validation results
        result.setWarnings(warnings);
        result.setHasOutliers(warnings.stream().anyMatch(w -> w.contains("outlier")));
        result.setHasMulticollinearity(warnings.stream().anyMatch(w -> w.contains("correlation")));
        
        // Calculate additional metrics
        calculateAdditionalMetrics(result);

        // Set additional metadata fields from monthlyData if available
        if (!monthlyData.isEmpty()) {
            MonthlyData sample = monthlyData.get(0);
            result.setYear(sample.getYear());
            result.setVehicleType(type);
            result.setRegion(sample.getRegion());
        }
        
        // Save to MongoDB and return
        return saveRegressionResult(result);
    }

    private void calculateAdditionalMetrics(RegressionResult result) {
        double[] residuals = result.getResiduals();
        int n = residuals.length;
        
        // Calculate RMSE
        double rmse = Math.sqrt(result.getMse());
        result.setRmse(rmse);
        
        // Calculate MAE
        double mae = 0;
        for (double residual : residuals) {
            mae += Math.abs(residual);
        }
        mae /= n;
        result.setMae(mae);
        
        // Calculate AIC
        int k = result.getType().equals("CAMION") ? 3 : 2; // intercept + coefficients
        double aic = n * Math.log(result.getMse()) + 2 * k;
        result.setAic(aic);
        
        // Calculate BIC
        double bic = n * Math.log(result.getMse()) + k * Math.log(n);
        result.setBic(bic);
        
        // Calculate VIF for truck regression
        if ("CAMION".equals(result.getType())) {
            double[] vif = calculateVIF(result);
            result.setVarianceInflationFactors(vif);
        }
    }

    private double[] calculateVIF(RegressionResult result) {
        double[] vif = new double[2];
        double correlation = Math.sqrt(result.getRSquared());
        double vifValue = 1 / (1 - correlation * correlation);
        vif[0] = vifValue; // kilometrage
        vif[1] = vifValue; // tonnage
        return vif;
    }

    private RegressionResult performCarRegression(List<MonthlyData> monthlyData) {
        double[][] x = new double[monthlyData.size()][1];
        double[] y = new double[monthlyData.size()];

        for (int i = 0; i < monthlyData.size(); i++) {
            MonthlyData data = monthlyData.get(i);
            x[i][0] = data.getKilometrage();
            y[i] = data.getConsommation();
        }

        OLSMultipleLinearRegression regression = new OLSMultipleLinearRegression();
        regression.newSampleData(y, x);

        double[] coefficients = regression.estimateRegressionParameters();
        double rSquared = regression.calculateRSquared();
        double adjustedRSquared = regression.calculateAdjustedRSquared();
        
        // Calculate predicted values and residuals
        double[] predictedValues = new double[y.length];
        double[] residuals = new double[y.length];
        for (int i = 0; i < y.length; i++) {
            predictedValues[i] = coefficients[0] + coefficients[1] * x[i][0];
            residuals[i] = y[i] - predictedValues[i];
        }

        // Calculate standard errors and t-stats
        double[][] covMatrix = regression.estimateRegressionParametersVariance();
        double[] standardErrors = new double[coefficients.length];
        double[] tStats = new double[coefficients.length];
        double[] pValues = new double[coefficients.length];
        double[] lowerConfidence = new double[coefficients.length];
        double[] upperConfidence = new double[coefficients.length];

        int df = y.length - coefficients.length;
        TDistribution tDist = new TDistribution(df);
        double tCritical = tDist.inverseCumulativeProbability(0.975);

        for (int i = 0; i < coefficients.length; i++) {
            standardErrors[i] = Math.sqrt(covMatrix[i][i]);
            tStats[i] = coefficients[i] / standardErrors[i];
            pValues[i] = 2 * (1 - tDist.cumulativeProbability(Math.abs(tStats[i])));
            lowerConfidence[i] = coefficients[i] - tCritical * standardErrors[i];
            upperConfidence[i] = coefficients[i] + tCritical * standardErrors[i];
        }

        // Calculate ANOVA statistics
        double meanY = 0;
        for (double value : y) {
            meanY += value;
        }
        meanY /= y.length;

        double totalSS = 0;
        double regressionSS = 0;
        double errorSS = 0;

        for (int i = 0; i < y.length; i++) {
            totalSS += Math.pow(y[i] - meanY, 2);
            regressionSS += Math.pow(predictedValues[i] - meanY, 2);
            errorSS += Math.pow(residuals[i], 2);
        }

        double regressionMS = regressionSS / 1;
        double errorMS = errorSS / (y.length - 2);
        double fStat = regressionMS / errorMS;

        FDistribution fDist = new FDistribution(1, y.length - 2);
        double significanceF = 1 - fDist.cumulativeProbability(fStat);

        String equation = String.format(
            "Consommation = %.4f * kilométrage %s %.2f",
            coefficients[1], 
            coefficients[0] >= 0 ? "+" : "-",
            Math.abs(coefficients[0])
        );
 
        RegressionCoefficients regressionCoefficients = RegressionCoefficients.builder()
            .kilometrage(coefficients[1])
            .tonnage(0.0)
            .build();

        return RegressionResult.builder()
            .id(UUID.randomUUID().toString())
            .type("VOITURE")
            .regressionEquation(equation)
            .coefficients(regressionCoefficients)
            .intercept(coefficients[0])
            .multipleR(Math.sqrt(rSquared))
            .rSquared(rSquared)
            .adjustedRSquared(adjustedRSquared)
            .standardError(Math.sqrt(errorMS))
            .observations(y.length)
            .degreesOfFreedom(df)
            .sumOfSquares(totalSS)
            .meanSquare(regressionMS)
            .fStatistic(fStat)
            .significanceF(significanceF)
            .standardErrors(standardErrors)
            .tStats(tStats)
            .pValues(pValues)
            .lowerConfidence(lowerConfidence)
            .upperConfidence(upperConfidence)
            .predictedValues(predictedValues)
            .residuals(residuals)
            .mse(errorMS)
            .build();
    }

    private RegressionResult performTruckRegression(List<MonthlyData> monthlyData) {
        List<MonthlyData> validData = monthlyData.stream()
            .filter(data -> data.getTonnage() > 0 && data.getKilometrage() > 0)
            .collect(Collectors.toList());

        if (validData.isEmpty()) {
            throw new IllegalArgumentException("No valid data points for regression analysis");
        }

        double[][] x = new double[validData.size()][2];
        double[] y = new double[validData.size()];

        for (int i = 0; i < validData.size(); i++) {
            MonthlyData data = validData.get(i);
            x[i][0] = data.getKilometrage();
            x[i][1] = data.getTonnage() / 1000.0;
            y[i] = data.getConsommation();
        }

        OLSMultipleLinearRegression regression = new OLSMultipleLinearRegression();
        regression.newSampleData(y, x);

        double[] coefficients = regression.estimateRegressionParameters();
        double rSquared = regression.calculateRSquared();
        double adjustedRSquared = regression.calculateAdjustedRSquared();

        double[] predictedValues = new double[y.length];
        double[] residuals = new double[y.length];
        for (int i = 0; i < y.length; i++) {
            predictedValues[i] = coefficients[0] + coefficients[1] * x[i][0] + coefficients[2] * x[i][1];
            residuals[i] = y[i] - predictedValues[i];
        }

        double[][] covMatrix = regression.estimateRegressionParametersVariance();
        double[] standardErrors = new double[coefficients.length];
        double[] tStats = new double[coefficients.length];
        double[] pValues = new double[coefficients.length];
        double[] lowerConfidence = new double[coefficients.length];
        double[] upperConfidence = new double[coefficients.length];

        int df = y.length - coefficients.length;
        TDistribution tDist = new TDistribution(df);
        double tCritical = tDist.inverseCumulativeProbability(0.975);

        for (int i = 0; i < coefficients.length; i++) {
            standardErrors[i] = Math.sqrt(covMatrix[i][i]);
            tStats[i] = coefficients[i] / standardErrors[i];
            pValues[i] = 2 * (1 - tDist.cumulativeProbability(Math.abs(tStats[i])));
            lowerConfidence[i] = coefficients[i] - tCritical * standardErrors[i];
            upperConfidence[i] = coefficients[i] + tCritical * standardErrors[i];
        }

        double meanY = 0;
        for (double value : y) {
            meanY += value;
        }
        meanY /= y.length;

        double totalSS = 0;
        double regressionSS = 0;
        double errorSS = 0;

        for (int i = 0; i < y.length; i++) {
            totalSS += Math.pow(y[i] - meanY, 2);
            regressionSS += Math.pow(predictedValues[i] - meanY, 2);
            errorSS += Math.pow(residuals[i], 2);
        }

        double regressionMS = regressionSS / 2;
        double errorMS = errorSS / (y.length - 3);
        double fStat = regressionMS / errorMS;

        FDistribution fDist = new FDistribution(2, y.length - 3);
        double significanceF = 1 - fDist.cumulativeProbability(fStat);

        String equation = String.format(
            "Consommation = %.4f * kilométrage %s %.4f * tonnage %s %.2f",
            coefficients[1],
            coefficients[2] >= 0 ? "+" : "-",
            Math.abs(coefficients[2]),
            coefficients[0] >= 0 ? "+" : "-",
            Math.abs(coefficients[0])
        );

        RegressionCoefficients regressionCoefficients = RegressionCoefficients.builder()
            .kilometrage(coefficients[1])
            .tonnage(coefficients[2])
            .build();

        return RegressionResult.builder()
            .id(UUID.randomUUID().toString())
            .type("CAMION")
            .regressionEquation(equation)
            .coefficients(regressionCoefficients)
            .intercept(coefficients[0])
            .multipleR(Math.sqrt(rSquared))
            .rSquared(rSquared)
            .adjustedRSquared(adjustedRSquared)
            .standardError(Math.sqrt(errorMS))
            .observations(y.length)
            .degreesOfFreedom(df)
            .sumOfSquares(totalSS)
            .meanSquare(regressionMS)
            .fStatistic(fStat)
            .significanceF(significanceF)
            .standardErrors(standardErrors)
            .tStats(tStats)
            .pValues(pValues)
            .lowerConfidence(lowerConfidence)
            .upperConfidence(upperConfidence)
            .predictedValues(predictedValues)
            .residuals(residuals)
            .mse(errorMS)
            .build();
    }

    @PostConstruct
    public void updateExistingEquations() {
        List<RegressionResult> results = getAllRegressionResults();
        for (RegressionResult result : results) {
            RegressionCoefficients coef = result.getCoefficients();
            String newEquation;
            
            if ("VOITURE".equals(result.getType())) {
                newEquation = String.format(
                    "Consommation = %.4f * kilométrage %s %.2f",
                    coef.getKilometrage(),
                    result.getIntercept() >= 0 ? "+" : "-",
                    Math.abs(result.getIntercept())
                );
            } else {
                newEquation = String.format(
                    "Consommation = %.4f * kilométrage %s %.4f * tonnage %s %.2f",
                    coef.getKilometrage(),
                    coef.getTonnage() >= 0 ? "+" : "-",
                    Math.abs(coef.getTonnage()),
                    result.getIntercept() >= 0 ? "+" : "-",
                    Math.abs(result.getIntercept())
                );
            }
            
            // Only update if equation format has changed
            if (!newEquation.equals(result.getRegressionEquation())) {
                result.setRegressionEquation(newEquation);
                saveRegressionResult(result);
            }
        }
    }
}
