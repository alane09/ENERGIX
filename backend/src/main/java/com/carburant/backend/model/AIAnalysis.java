package com.carburant.backend.model;

import java.util.List;
import java.util.Map;

/**
 * Model representing AI-generated analysis for reports
 */
public class AIAnalysis {
    private String summary;
    private List<String> insights;
    private List<String> recommendations;
    private Map<String, Object> metrics;
    private Map<String, Object> trends;
    private Map<String, Object> anomalies;

    public AIAnalysis() {
    }

    public String getSummary() {
        return summary;
    }

    public void setSummary(String summary) {
        this.summary = summary;
    }

    public List<String> getInsights() {
        return insights;
    }

    public void setInsights(List<String> insights) {
        this.insights = insights;
    }

    public List<String> getRecommendations() {
        return recommendations;
    }

    public void setRecommendations(List<String> recommendations) {
        this.recommendations = recommendations;
    }

    public Map<String, Object> getMetrics() {
        return metrics;
    }

    public void setMetrics(Map<String, Object> metrics) {
        this.metrics = metrics;
    }

    public Map<String, Object> getTrends() {
        return trends;
    }

    public void setTrends(Map<String, Object> trends) {
        this.trends = trends;
    }

    public Map<String, Object> getAnomalies() {
        return anomalies;
    }

    public void setAnomalies(Map<String, Object> anomalies) {
        this.anomalies = anomalies;
    }
}
