package com.carburant.backend.service;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.TreeMap;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.carburant.backend.model.VehicleRecord;
import com.carburant.backend.repository.VehicleRepository;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class VehicleService {
    private final VehicleRepository vehicleRepository;
    private final ExcelService excelService;
    private final MongoTemplate mongoTemplate;
    private final NotificationService notificationService;
    private final RegressionService regressionService;
    private final SERService serService;
    
    private byte[] cachedFileContent;
    private String cachedFileName;
    private List<String> cachedSheetNames;

    @Autowired
    public VehicleService(
            VehicleRepository vehicleRepository, 
            ExcelService excelService, 
            MongoTemplate mongoTemplate,
            NotificationService notificationService,
            RegressionService regressionService,
            SERService serService) {
        this.vehicleRepository = vehicleRepository;
        this.excelService = excelService;
        this.mongoTemplate = mongoTemplate;
        this.notificationService = notificationService;
        this.regressionService = regressionService;
        this.serService = serService;
        this.cachedSheetNames = new ArrayList<>();
    }

    public List<VehicleRecord> getAllRecords() {
        return vehicleRepository.findAll();
    }

    public Optional<VehicleRecord> getRecordById(String id) {
        return vehicleRepository.findById(id);
    }

    public List<VehicleRecord> getRecordsByType(String type) {
        return vehicleRepository.findByType(type);
    }

    public List<VehicleRecord> getRecordsByTypeAndMonth(String type, String mois) {
        return vehicleRepository.findByTypeAndMois(type, mois);
    }
    
    public List<VehicleRecord> getRecordsByMonth(String mois) {
        return vehicleRepository.findByMois(mois);
    }

    public List<VehicleRecord> getRecordsByMatricule(String matricule) {
        return vehicleRepository.findByMatricule(matricule);
    }

    public List<VehicleRecord> getRecordsByYear(String year) {
        return vehicleRepository.findByYear(year);
    }

    public List<VehicleRecord> getRecordsByYearAndMois(String year, String mois) {
        return vehicleRepository.findByYearAndMois(year, mois);
    }

    public List<VehicleRecord> getRecordsByTypeAndYear(String type, String year) {
        return vehicleRepository.findByTypeAndYear(type, year);
    }

    public List<VehicleRecord> getRecordsByMatriculeAndYear(String matricule, String year) {
        return vehicleRepository.findByMatriculeAndYear(matricule, year);
    }

    public List<VehicleRecord> getRecordsByTypeMatriculeAndYear(String type, String matricule, String year) {
        return vehicleRepository.findByTypeAndMatriculeAndYear(type, matricule, year);
    }

    public List<VehicleRecord> getRecordsByTypeYearAndMonth(String type, String year, String mois) {
        return vehicleRepository.findByTypeAndYearAndMois(type, year, mois);
    }

    public List<VehicleRecord> getRecordsByMatriculeAndYearAndMois(String matricule, String year, String mois) {
        return vehicleRepository.findByMatriculeAndYearAndMois(matricule, year, mois);
    }

    public List<VehicleRecord> getRecordsByTypeAndMatriculeAndYearAndMois(String type, String matricule, String year, String mois) {
        return vehicleRepository.findByTypeAndMatriculeAndYearAndMois(type, matricule, year, mois);
    }

    public List<VehicleRecord> getRecordsByTypeAndMatricule(String type, String matricule) {
        return vehicleRepository.findByTypeAndMatricule(type, matricule);
    }

    public List<String> getCachedSheetNames() {
        if (cachedSheetNames == null || cachedSheetNames.isEmpty()) {
            log.info("No sheet names are cached. Returning default vehicle types.");
            List<String> defaultTypes = new ArrayList<>();
            defaultTypes.add("all");
            
            try {
                List<String> dbTypes = vehicleRepository.findDistinctTypes();
                if (dbTypes != null && !dbTypes.isEmpty()) {
                    defaultTypes.addAll(dbTypes);
                    log.info("Added {} vehicle types from database", dbTypes.size());
                }
            } catch (Exception e) {
                log.warn("Could not retrieve vehicle types from database: {}", e.getMessage());
                defaultTypes.add("camions");
                defaultTypes.add("voitures");
            }
            
            return defaultTypes;
        }
        return cachedSheetNames;
    }

    public List<String> processAndCacheFile(MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) {
            log.error("Empty file received for caching");
            throw new IllegalArgumentException("File cannot be empty");
        }
        
        log.info("Processing and caching file: {}", file.getOriginalFilename());
        
        this.cachedFileContent = file.getBytes();
        this.cachedFileName = file.getOriginalFilename();
        this.cachedSheetNames = excelService.extractSheetNames(file);
        
        log.info("Successfully cached file: {} with {} sheets", this.cachedFileName, this.cachedSheetNames.size());
        return this.cachedSheetNames;
    }

    public List<VehicleRecord> extractDataFromCacheWithoutSaving(String sheetName) throws IOException {
        if (cachedFileContent == null || cachedFileContent.length == 0) {
            log.error("No file content is cached for extraction");
            throw new IllegalStateException("No file has been uploaded. Please upload a file first.");
        }
        
        log.info("Extracting data from cached file sheet: {} (WITHOUT SAVING TO DATABASE)", sheetName);
        
        ByteArrayInputStream inputStream = new ByteArrayInputStream(cachedFileContent);
        ExcelService.ExtractionResult extractionResult = excelService.extractDataFromInputStream(inputStream, sheetName);
        List<VehicleRecord> records = extractionResult.getVehicleRecords();
        log.info("Extracted {} records from sheet {} (NOT SAVED TO DATABASE)", records.size(), sheetName);
        
        return records;
    }

    public List<VehicleRecord> extractDataFromCache(String sheetName) throws IOException {
        return extractDataFromCache(sheetName, true);
    }

    public List<VehicleRecord> extractDataFromCache(String sheetName, boolean replaceExisting) throws IOException {
        if (cachedFileContent == null || cachedFileContent.length == 0) {
            log.error("No file content is cached for extraction");
            throw new IllegalStateException("No file has been uploaded. Please upload a file first.");
        }
        
        log.info("Extracting data from cached file sheet: {}, replaceExisting: {}", sheetName, replaceExisting);
        
        ByteArrayInputStream inputStream = new ByteArrayInputStream(cachedFileContent);
        ExcelService.ExtractionResult extractionResult = excelService.extractDataFromInputStream(inputStream, sheetName);
        List<VehicleRecord> records = extractionResult.getVehicleRecords();
        log.info("Extracted {} records from sheet {}", records.size(), sheetName);
        
        return saveRecordsWithDuplicatePrevention(records, sheetName, replaceExisting);
    }

    public int saveRecords(List<VehicleRecord> records, String type, String year, String month, boolean replaceExisting, String region) {
        if (records == null || records.isEmpty()) {
            return 0;
        }

        records.forEach(record -> {
            record.setType(type);
            record.setYear(year);
            record.setMois(month);
            record.setRegion(region);
        });

        List<VehicleRecord> savedRecords = saveRecordsWithDuplicatePrevention(records, type, replaceExisting);
        return savedRecords.size();
    }

    private List<VehicleRecord> saveRecordsWithDuplicatePrevention(List<VehicleRecord> records, String type, boolean replaceExisting) {
        if (records == null || records.isEmpty()) {
            log.info("No records to save for type: {}", type);
            return List.of();
        }
        
        if (replaceExisting) {
            log.info("Deleting existing records for type: {}", type);
            vehicleRepository.deleteByType(type);
            List<VehicleRecord> savedRecords = saveAll(records);
            log.info("Saved {} records to database", savedRecords.size());
            return savedRecords;
        } else {
            log.info("Using selective update approach to prevent duplicates for type: {}", type);
            List<VehicleRecord> existingRecords = vehicleRepository.findByType(type);
            Map<String, VehicleRecord> existingRecordsMap = new HashMap<>();
            for (VehicleRecord record : existingRecords) {
                String key = generateNaturalKey(record);
                existingRecordsMap.put(key, record);
            }
            
            List<VehicleRecord> recordsToSave = new ArrayList<>();
            for (VehicleRecord record : records) {
                record.setType(type);
                String key = generateNaturalKey(record);
                if (existingRecordsMap.containsKey(key)) {
                    VehicleRecord existingRecord = existingRecordsMap.get(key);
                    record.setId(existingRecord.getId());
                }
                recordsToSave.add(record);
            }
            
            return saveAll(recordsToSave);
        }
    }

    private String generateNaturalKey(VehicleRecord record) {
        return String.format("%s:%s:%s:%s", 
            record.getType() == null ? "" : record.getType(), 
            record.getMatricule() == null ? "" : record.getMatricule(), 
            record.getMois() == null ? "" : record.getMois(), 
            record.getYear() == null ? "" : record.getYear());
    }

    public VehicleRecord saveRecord(VehicleRecord record) {
        if (record.getIpeL100km() == 0) {
            record.calculateIndices();
        }
        
        // Calculate and set IPE_SER values for all records
        if (record.isCamion()) {
            // For trucks, calculate IPE_SER for both L/100km and L/100km·T
            double ipeSerL100km = serService.calculateIPE_SER_L100km(record);
            double ipeSerL100kmT = serService.calculateIPE_SER(record);
            
            record.setIpeSerL100km(ipeSerL100km);
            record.setIpeSerL100TonneKm(ipeSerL100kmT);
            
            log.debug("Set IPE_SER values for truck {}: L/100km={}, L/100km·T={}", 
                record.getMatricule(), ipeSerL100km, ipeSerL100kmT);
        } else {
            // For cars and other vehicles, only calculate IPE_SER L/100km
            double ipeSerL100km = serService.calculateIPE_SER_L100km(record);
            record.setIpeSerL100km(ipeSerL100km);
            
            log.debug("Set IPE_SER L/100km value for vehicle {}: {}", 
                record.getMatricule(), ipeSerL100km);
        }
        
        VehicleRecord savedRecord = vehicleRepository.save(record);
        checkForAnomaliesAndNotify(savedRecord);
        return savedRecord;
    }

    private void checkForAnomaliesAndNotify(VehicleRecord record) {
        // Only check IPE/Tonne anomalies for trucks
        if (record.isCamion()) {
            double ipe_ser = serService.calculateIPE_SER(record);
            boolean exceedsSERLimits = record.getIpeL100TonneKm() > ipe_ser;
            
            if (exceedsSERLimits && ipe_ser > 0.0) {
                Map<String, Object> metadata = new HashMap<>();
                metadata.put("ipeL100TonneKm", record.getIpeL100TonneKm());
                metadata.put("ipe_ser", ipe_ser);
                metadata.put("consommation", record.getConsommationL());
                metadata.put("kilometrage", record.getKilometrage());
                metadata.put("tonnage", record.getProduitsTonnes());
                metadata.put("region", record.getRegion());
                metadata.put("year", record.getYear());
                metadata.put("exceedsSER", true);
                
                String message = String.format(
                    "Anomalie SER détectée pour le véhicule %s (%s %s). " +
                    "IPE: %.2f L/100km·T > IPE_SER: %.2f L/100km·T. " +
                    "Consommation: %.2f L, Kilométrage: %.2f km, Tonnage: %.2f T",
                    record.getMatricule(), 
                    record.getMois(), 
                    record.getYear(),
                    record.getIpeL100TonneKm(),
                    ipe_ser,
                    record.getConsommationL(),
                    record.getKilometrage(),
                    record.getProduitsTonnes()
                );

                notificationService.createNotification(
                    "Anomalie SER - " + record.getType(),
                    message,
                    "ANOMALY",
                    "HIGH",
                    record.getMatricule(),
                    record.getType(),
                    record.getRegion(),
                    record.getYear(),
                    metadata
                );
                
                log.info("Created SER anomaly notification for vehicle {} - IPE: {} > IPE_SER: {}", 
                    record.getMatricule(), record.getIpeL100TonneKm(), ipe_ser);
            }
        }
    }

    public VehicleRecord updateRecord(String id, VehicleRecord record) {
        record.setId(id);
        return saveRecord(record);
    }

    public void deleteRecord(String id) {
        vehicleRepository.deleteById(id);
    }

    public List<VehicleRecord> saveAll(List<VehicleRecord> records) {
        List<VehicleRecord> savedRecords = new ArrayList<>();
        for (VehicleRecord record : records) {
            savedRecords.add(saveRecord(record));
        }
        return savedRecords;
    }

    public List<Map<String, Object>> getMonthlyAggregatedData(String vehicleType, String year, String dateFrom, String dateTo) {
        Query query = new Query();
        
        if (vehicleType != null && !vehicleType.isEmpty() && !vehicleType.equals("all")) {
            query.addCriteria(Criteria.where("type").is(vehicleType));
        }
        
        if (year != null && !year.isEmpty()) {
            query.addCriteria(Criteria.where("year").is(year));
        }
        
        if (dateFrom != null && !dateFrom.isEmpty()) {
            query.addCriteria(Criteria.where("mois").gte(dateFrom));
        }
        
        if (dateTo != null && !dateTo.isEmpty()) {
            query.addCriteria(Criteria.where("mois").lte(dateTo));
        }
        
        List<VehicleRecord> records = mongoTemplate.find(query, VehicleRecord.class);
        
        if (records.isEmpty()) {
            return List.of();
        }
        
        Map<String, Map<String, Object>> monthlyData = new TreeMap<>();
        
        for (VehicleRecord record : records) {
            String month = record.getMois();
            if (month == null || month.isEmpty()) continue;
            
            monthlyData.computeIfAbsent(month, k -> {
                Map<String, Object> monthData = new HashMap<>();
                monthData.put("month", k);
                monthData.put("kilometrage", 0.0);
                monthData.put("consommation", 0.0);
                monthData.put("produitsTonnes", 0.0);
                monthData.put("ipeL100km", 0.0);
                monthData.put("count", 0);
                return monthData;
            });
            
            Map<String, Object> monthData = monthlyData.get(month);
            double kilometrage = record.getKilometrage();
            double consommation = record.getConsommationL();
            double produitsTonnes = record.getProduitsTonnes();
            double ipeL100km = record.getIpeL100km();
            
            monthData.put("kilometrage", (Double) monthData.get("kilometrage") + kilometrage);
            monthData.put("consommation", (Double) monthData.get("consommation") + consommation);
            monthData.put("produitsTonnes", (Double) monthData.get("produitsTonnes") + produitsTonnes);
            monthData.put("ipeL100km", (Double) monthData.get("ipeL100km") + ipeL100km);
            monthData.put("count", (Integer) monthData.get("count") + 1);
        }
        
        return monthlyData.values().stream()
            .map(monthData -> {
                int count = (Integer) monthData.get("count");
                if (count > 0) {
                    monthData.put("ipeL100km", (Double) monthData.get("ipeL100km") / count);
                }
                return monthData;
            })
            .collect(Collectors.toList());
    }
    
    public List<Map<String, Object>> getVehiclePerformanceData(String type) {
        List<VehicleRecord> records = getRecordsByType(type);
        Map<String, List<VehicleRecord>> recordsByMatricule = records.stream()
            .collect(Collectors.groupingBy(VehicleRecord::getMatricule));
        
        List<Map<String, Object>> result = new ArrayList<>();
        
        for (Map.Entry<String, List<VehicleRecord>> entry : recordsByMatricule.entrySet()) {
            String matricule = entry.getKey();
            List<VehicleRecord> vehicleRecords = entry.getValue();
            
            double totalConsommationL = 0;
            double totalKilometrage = 0;
            double totalProduitsTonnes = 0;
            
            for (VehicleRecord record : vehicleRecords) {
                totalConsommationL += record.getConsommationL();
                totalKilometrage += record.getKilometrage();
                totalProduitsTonnes += record.getProduitsTonnes();
            }
            
            Map<String, Object> vehicleData = new HashMap<>();
            vehicleData.put("matricule", matricule);
            vehicleData.put("consommationTotaleL", totalConsommationL);
            vehicleData.put("kilometrageTotalKm", totalKilometrage);
            vehicleData.put("produitsTotalTonnes", totalProduitsTonnes);
            
            if (totalKilometrage > 0) {
                double ipeL100km = totalConsommationL / (totalKilometrage / 100);
                vehicleData.put("ipeL100km", ipeL100km);
                
                if (totalProduitsTonnes > 0) {
                    double ipeL100TonneKm = ipeL100km * (1 / (totalProduitsTonnes / 1000));
                    vehicleData.put("ipeL100TonneKm", ipeL100TonneKm);
                }
            }
            
            Map<String, Map<String, Double>> monthlyData = new HashMap<>();
            for (VehicleRecord record : vehicleRecords) {
                String month = record.getMois();
                Map<String, Double> metrics = new HashMap<>();
                
                metrics.put("consommationL", record.getConsommationL());
                metrics.put("consommationTEP", record.getConsommationTEP());
                metrics.put("coutDT", record.getCoutDT());
                metrics.put("kilometrage", record.getKilometrage());
                metrics.put("produitsTonnes", record.getProduitsTonnes());
                metrics.put("ipeL100km", record.getIpeL100km());
                metrics.put("ipeL100TonneKm", record.getIpeL100TonneKm());
                
                monthlyData.put(month, metrics);
            }
            
            vehicleData.put("monthlyData", monthlyData);
            result.add(vehicleData);
        }
        
        return result;
    }

    public int scanAllRecordsForAnomalies() {
        log.info("Starting comprehensive anomaly scan for all vehicle records");
        
        List<VehicleRecord> allRecords = getAllRecords();
        int anomaliesFound = 0;
        
        for (VehicleRecord record : allRecords) {
            if (isAnomalyRecord(record)) {
                checkForAnomaliesAndNotify(record);
                anomaliesFound++;
            }
        }
        
        log.info("Anomaly scan completed. Found {} anomalies out of {} total records", 
                   anomaliesFound, allRecords.size());
        return anomaliesFound;
    }

    private boolean isAnomalyRecord(VehicleRecord record) {
        if (record.isCamion()) {
            double ipe_ser = serService.calculateIPE_SER(record);
            return ipe_ser > 0.0 && record.getIpeL100TonneKm() > ipe_ser;
        }
        return false;
    }

    public long getAnomalyCount() {
        List<VehicleRecord> allRecords = getAllRecords();
        return allRecords.stream()
            .mapToLong(record -> isAnomalyRecord(record) ? 1 : 0)
            .sum();
    }

    public List<VehicleRecord> getAllAnomalousRecords() {
        List<VehicleRecord> allRecords = getAllRecords();
        return allRecords.stream()
            .filter(this::isAnomalyRecord)
            .collect(Collectors.toList());
    }
}
