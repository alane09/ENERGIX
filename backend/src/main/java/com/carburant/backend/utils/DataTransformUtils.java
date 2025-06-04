package com.carburant.backend.utils;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import com.carburant.backend.model.MonthlyData;
import com.carburant.backend.model.VehicleRecord;

public class DataTransformUtils {
    
    public static List<MonthlyData> transformToMonthlyData(List<VehicleRecord> records, String vehicleType, String year) {
        // Group records by month
        Map<String, List<VehicleRecord>> recordsByMonth = records.stream()
            .collect(Collectors.groupingBy(VehicleRecord::getMois));
            
        List<MonthlyData> monthlyDataList = new ArrayList<>();
        
        recordsByMonth.forEach((month, monthRecords) -> {
            MonthlyData monthlyData = MonthlyData.fromVehicleRecords(monthRecords);
            monthlyDataList.add(monthlyData);
        });
        
        return monthlyDataList;
    }
}
