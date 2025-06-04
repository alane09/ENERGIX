package com.carburant.backend.service;

import com.carburant.backend.model.AIAnalysis;

import java.util.Map;

/**
 * Service interface for AI-powered data analysis
 */
public interface AIAnalysisService {
    /**
     * Analyze data and generate insights
     * @param data Data to analyze
     * @return AI-generated analysis
     */
    AIAnalysis analyze(Map<String, Object> data);
    
    /**
     * Generate recommendations based on analyzed data
     * @param data Data to analyze
     * @return List of recommendations
     */
    AIAnalysis generateRecommendations(Map<String, Object> data);
    
    /**
     * Detect anomalies in the provided data
     * @param data Data to analyze
     * @return Analysis with anomalies highlighted
     */
    AIAnalysis detectAnomalies(Map<String, Object> data);
    
    /**
     * Generate a natural language summary of the data
     * @param data Data to summarize
     * @return Analysis with summary
     */
    AIAnalysis generateSummary(Map<String, Object> data);
}
