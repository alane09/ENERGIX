package com.carburant.backend.model;

import java.util.List;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "regression_results")
public class RegressionResult {
    @Id
    private String id;
    private String type;
    private String regressionEquation;
    private RegressionCoefficients coefficients;
    private double intercept;
    
    // Validation Results
    private List<String> warnings;
    private boolean hasOutliers;
    private boolean hasMulticollinearity;
    private double[] varianceInflationFactors; // For multicollinearity assessment
    
    // Regression Statistics
    private double multipleR;        // Multiple R (correlation coefficient)
    private double rSquared;         // R Square
    private double adjustedRSquared; // Adjusted R Square
    private double standardError;    // Standard Error
    private int observations;        // Number of observations
    private double mse;             // Mean Square Error
    private double rmse;            // Root Mean Square Error
    private double mae;             // Mean Absolute Error
    private double aic;             // Akaike Information Criterion
    private double bic;             // Bayesian Information Criterion
    
    // ANOVA
    private double degreesOfFreedom; // df
    private double sumOfSquares;     // SS
    private double meanSquare;       // MS
    private double fStatistic;       // F
    private double significanceF;    // Significance F
    
    // Coefficient Statistics
    private double[] standardErrors; // Standard errors for each coefficient
    private double[] tStats;        // t Statistics
    private double[] pValues;       // P-values
    private double[] lowerConfidence; // Lower 95% confidence intervals
    private double[] upperConfidence; // Upper 95% confidence intervals
    
    // Residual Output
    private double[] predictedValues;
    private double[] residuals;
    
    // Additional fields
    private String year;
    private String vehicleType;
    private String region;
}
