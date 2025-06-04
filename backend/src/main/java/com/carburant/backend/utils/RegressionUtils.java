package com.carburant.backend.utils;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.apache.commons.math3.stat.regression.SimpleRegression;

import com.carburant.backend.model.MonthlyData;
import com.carburant.backend.model.RegressionCoefficients;
import com.carburant.backend.model.RegressionResult;

public class RegressionUtils {

    public static RegressionResult performSimpleRegression(List<MonthlyData> monthlyData, String type) {
        SimpleRegression regression = new SimpleRegression();
        
        // Add data points
        for (MonthlyData data : monthlyData) {
            regression.addData(data.getKilometrage(), data.getConsommation());
        }
        
        // Perform regression
        regression.regress();
        
        // Create regression coefficients
        RegressionCoefficients coefficients = RegressionCoefficients.builder()
            .kilometrage(regression.getSlope())
            .build();
        
        // Format equation
        String equation = String.format("y = %.4fx + %.4f", regression.getSlope(), regression.getIntercept());
        
        // Build result
        return RegressionResult.builder()
            .type(type)
            .regressionEquation(equation)
            .coefficients(coefficients)
            .intercept(regression.getIntercept())
            .rSquared(regression.getRSquare())
            .adjustedRSquared(calculateAdjustedRSquared(regression.getRSquare(), monthlyData.size(), 1))
            .mse(regression.getMeanSquareError())
            .build();
    }
    
    public static RegressionResult performMultipleRegression(List<MonthlyData> monthlyData, String type) {
        // Prepare data
        double[][] x = new double[monthlyData.size()][2];
        double[] y = new double[monthlyData.size()];
        
        for (int i = 0; i < monthlyData.size(); i++) {
            MonthlyData data = monthlyData.get(i);
            x[i][0] = data.getKilometrage();
            x[i][1] = data.getTonnage();
            y[i] = data.getConsommation();
        }
        
        // Perform regression using OLS
        org.apache.commons.math3.stat.regression.OLSMultipleLinearRegression regression = 
            new org.apache.commons.math3.stat.regression.OLSMultipleLinearRegression();
        regression.newSampleData(y, x);
        
        // Get coefficients
        double[] coefficients = regression.estimateRegressionParameters();
        
        // Create regression coefficients
        RegressionCoefficients regressionCoefficients = RegressionCoefficients.builder()
            .kilometrage(coefficients[1])
            .tonnage(coefficients[2])
            .build();
        
        // Format equation
        String equation = String.format("y = %.4fx₁ + %.4fx₂ + %.4f", 
            coefficients[1], coefficients[2], coefficients[0]);
        
        // Build result
        return RegressionResult.builder()
            .type(type)
            .regressionEquation(equation)
            .coefficients(regressionCoefficients)
            .intercept(coefficients[0])
            .rSquared(regression.calculateRSquared())
            .adjustedRSquared(regression.calculateAdjustedRSquared())
            .mse(calculateMSE(y, regression.estimateResiduals()))
            .build();
    }
    
    private static double calculateAdjustedRSquared(double rSquared, int n, int p) {
        return 1 - ((1 - rSquared) * (n - 1) / (n - p - 1));
    }
    
    private static double calculateMSE(double[] actual, double[] residuals) {
        double sumSquaredResiduals = 0;
        for (double residual : residuals) {
            sumSquaredResiduals += residual * residual;
        }
        return sumSquaredResiduals / residuals.length;
    }
    
    public static List<Map<String, Object>> prepareRegressionData(List<MonthlyData> monthlyData) {
        return monthlyData.stream()
            .map(data -> {
                Map<String, Object> map = new HashMap<>();
                map.put("month", data.getMonth());
                map.put("kilometrage", data.getKilometrage());
                map.put("consommation", data.getConsommation());
                map.put("tonnage", data.getTonnage());
                return map;
            })
            .collect(Collectors.toList());
    }
    
    public static List<Map<String, Object>> prepareMonthlyTrends(List<MonthlyData> monthlyData) {
        return monthlyData.stream()
            .map(data -> {
                Map<String, Object> map = new HashMap<>();
                map.put("month", data.getMonth());
                map.put("actual", data.getConsommation());
                map.put("reference", data.getReferenceConsommation());
                map.put("target", data.getTargetConsommation());
                return map;
            })
            .collect(Collectors.toList());
    }
}
