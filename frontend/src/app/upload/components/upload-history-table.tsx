import { Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material';
import { useState, useEffect } from 'react';

interface UploadFile {
  date: string;
  vehicleTypes: string[];
  year: number;
  [key: string]: any;
}

interface SortConfig {
  field: string;
  direction: 'asc' | 'desc';
}

interface Filters {
  vehicleType?: string;
  year?: string;
  matricule?: string;
  dateRange?: {
    from: Date | null;
    to: Date | null;
  };
}

interface UploadHistoryTableProps {
  files: UploadFile[];
  filters: Filters;
  sortConfig: SortConfig;
}

const UploadHistoryTable = ({ files, filters, sortConfig }: UploadHistoryTableProps) => {
  const [filteredFiles, setFilteredFiles] = useState<UploadFile[]>(files);

  // This helper function renders vehicle types as badges
  const renderVehicleTypes = (vehicleTypes: string[]) => {
    if (!vehicleTypes || vehicleTypes.length === 0) {
      return <span className="text-gray-500">Non spécifié</span>;
    }

    return (
      <div className="flex flex-wrap gap-1">
        {vehicleTypes.map((type: string) => (
          <span
            key={type}
            className="inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-800 px-2 py-1 text-xs font-medium text-gray-700 dark:text-gray-300"
          >
            {type}
          </span>
        ))}
      </div>
    );
  };

  // Apply filters when they change
  useEffect(() => {
    let result = [...files];
    
    if (filters.vehicleType && filters.vehicleType !== 'all') {
      result = result.filter(file => 
        file.vehicleTypes && 
        file.vehicleTypes.some(type => type.toLowerCase().includes(filters.vehicleType?.toLowerCase() || ''))
      );
    }
    
    // Sort the filtered files
    result.sort((a, b) => {
      if (sortConfig.field === 'date') {
        return sortConfig.direction === 'asc' 
          ? new Date(a.date).getTime() - new Date(b.date).getTime()
          : new Date(b.date).getTime() - new Date(a.date).getTime();
      } 
      
      if (sortConfig.field === 'vehicleTypes') {
        // Compare the first vehicle type in the array or empty string if array is empty
        const aType = a.vehicleTypes?.length ? a.vehicleTypes[0] : '';
        const bType = b.vehicleTypes?.length ? b.vehicleTypes[0] : '';
        return sortConfig.direction === 'asc'
          ? aType.localeCompare(bType)
          : bType.localeCompare(aType);
      }
      
      if (sortConfig.field === 'year') {
        return sortConfig.direction === 'asc'
          ? a.year - b.year
          : b.year - a.year;
      }
      
      return 0;
    });
    
    setFilteredFiles(result);
  }, [files, filters, sortConfig]);

  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableCell>Date</TableCell>
          <TableCell>Vehicle Types</TableCell>
          <TableCell>Year</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {filteredFiles.map((file, index) => (
          <TableRow key={index}>
            <TableCell>{file.date}</TableCell>
            <TableCell>
              {renderVehicleTypes(file.vehicleTypes)}
            </TableCell>
            <TableCell>{file.year}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default UploadHistoryTable;