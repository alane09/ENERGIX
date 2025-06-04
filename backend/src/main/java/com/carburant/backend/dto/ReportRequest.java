package com.carburant.backend.dto;

import java.util.List;

public class ReportRequest {
    private String type;
    private String startDate;
    private String endDate;
    private String format;
    private List<ConsumptionData> consumption;
    private List<VehicleData> vehicles;

    public ReportRequest() {}

    public ReportRequest(String type, String startDate, String endDate, String format,
                         List<ConsumptionData> consumption, List<VehicleData> vehicles) {
        this.type = type;
        this.startDate = startDate;
        this.endDate = endDate;
        this.format = format;
        this.consumption = consumption;
        this.vehicles = vehicles;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getStartDate() {
        return startDate;
    }

    public void setStartDate(String startDate) {
        this.startDate = startDate;
    }

    public String getEndDate() {
        return endDate;
    }

    public void setEndDate(String endDate) {
        this.endDate = endDate;
    }

    public String getFormat() {
        return format;
    }

    public void setFormat(String format) {
        this.format = format;
    }

    public List<ConsumptionData> getConsumption() {
        return consumption;
    }

    public void setConsumption(List<ConsumptionData> consumption) {
        this.consumption = consumption;
    }

    public List<VehicleData> getVehicles() {
        return vehicles;
    }

    public void setVehicles(List<VehicleData> vehicles) {
        this.vehicles = vehicles;
    }
}
