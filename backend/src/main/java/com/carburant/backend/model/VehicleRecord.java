package com.carburant.backend.model;

import java.util.HashMap;
import java.util.Map;

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
@Document(collection = "vehicle_data")
public class VehicleRecord {
    @Id
    private String id;
    private String type;             // Vehicle type (sheet name: Camions, Voitures, etc.)
    private String matricule;        // Vehicle registration number
    private String mois;             // Month (from merged cells)
    private String year;             // Year of the record
    private String region;           // Region (geographical area)
    private double consommationL;    // Consumption in L
    private double consommationTEP;  // Consumption in TEP
    private double coutDT;           // Cost in DT
    private double kilometrage;      // Distance in Km
    private double produitsTonnes;   // Transported products in Tons (for trucks)
    private double ipeL100km;        // Energy Performance Index in L/100km (for utility vehicles)
    private double ipeL100TonneKm;   // Energy Performance Index in L/Tonne.100Km (for trucks)
    private Double predictedIpe;      // Predicted IPE from SER regression equation (L/100km·T for trucks, L/100km for cars)
    private Double ipeSerL100km;      // IPE_SER in L/100km (reference value)
    private Double ipeSerL100TonneKm; // IPE_SER in L/100km·T (reference value for trucks)
    private Map<String, Double> rawValues;  // Raw values for any additional metrics

    public boolean isCamion() {
        return "CAMION".equalsIgnoreCase(type) || "CAMIONS".equalsIgnoreCase(type);
    }
    
    public boolean isVoiture() {
        return "VOITURE".equalsIgnoreCase(type) || "VOITURES".equalsIgnoreCase(type);
    }

    public void calculateIndices() {
        // Calculate IPE (Indice de Performance Énergétique) in L/100km
        this.ipeL100km = kilometrage > 0 ? (consommationL * 100) / kilometrage : 0;
        
        // Calculate IPE per tonne-km for trucks (L/100km·T)
        if (isCamion() && produitsTonnes > 0 && kilometrage > 0) {
            this.ipeL100TonneKm = (consommationL * 100) / (kilometrage * produitsTonnes);
        } else {
            this.ipeL100TonneKm = 0;
        }

        // TEP conversion factor (1L diesel = 0.00086 TEP)
        double tepFactor = 0.00086;
        this.consommationTEP = consommationL * tepFactor;

        // Cost calculation (1L diesel = 2.5 DT)
        double prixLitre = 2.5;
        this.coutDT = consommationL * prixLitre;

        // Store raw values for regression analysis
        if (this.rawValues == null) {
            this.rawValues = new HashMap<>();
        }
        this.rawValues.put("kilometrage", kilometrage);
        this.rawValues.put("consommationL", consommationL);
        if (produitsTonnes > 0) {
            this.rawValues.put("produitsTonnes", produitsTonnes);
        }
    }
}
