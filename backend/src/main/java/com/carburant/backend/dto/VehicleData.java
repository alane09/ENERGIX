package com.carburant.backend.dto;

import java.util.List;

public class VehicleData {
    private String id;
    private String type;
    private String matricule;
    private List<ConsumptionData> consumption;
    private Double efficiency;
    private String status;

    public VehicleData() {}

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getMatricule() {
        return matricule;
    }

    public void setMatricule(String matricule) {
        this.matricule = matricule;
    }

    public List<ConsumptionData> getConsumption() {
        return consumption;
    }

    public void setConsumption(List<ConsumptionData> consumption) {
        this.consumption = consumption;
    }

    public Double getEfficiency() {
        return efficiency;
    }

    public void setEfficiency(Double efficiency) {
        this.efficiency = efficiency;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
