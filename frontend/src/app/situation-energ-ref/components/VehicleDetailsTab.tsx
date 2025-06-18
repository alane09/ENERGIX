import { regressionAPI } from "@/app/situation-energ-ref/api/regression";
import { VehicleData } from "@/app/situation-energ-ref/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

const MONTH_NAMES: { [key: string]: string } = {
  "01": "Janvier",
  "02": "Février",
  "03": "Mars",
  "04": "Avril",
  "05": "Mai",
  "06": "Juin",
  "07": "Juillet",
  "08": "Août",
  "09": "Septembre",
  "10": "Octobre",
  "11": "Novembre",
  "12": "Décembre",
};

interface VehicleDetailsTabProps {
  filters: {
    vehicleType: string;
    region: string;
    year: string;
  };
}

export function VehicleDetailsTab({ filters }: VehicleDetailsTabProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<VehicleData[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedMatricule, setSelectedMatricule] = useState<string>("all");
  const [filteredData, setFilteredData] = useState<VehicleData[]>([]);
  const [uniqueTypes, setUniqueTypes] = useState<string[]>([]);
  const [uniqueMatricules, setUniqueMatricules] = useState<string[]>([]);

  // Fetch data when filters change
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        console.log("Fetching vehicle details with filters:", filters);
        
        const response = await regressionAPI.getVehicleDetails({
          vehicleType: filters.vehicleType as "VOITURE" | "CAMION",
          year: filters.year,
          region: filters.region === "all" ? undefined : filters.region,
        });

        console.log("API Response:", response);

        if (response.data && response.data.length > 0) {
          setData(response.data);
          console.log("Data loaded:", response.data.length, "records");

          // Get unique types and matricules
          const types = ["all", ...new Set(response.data.map((record) => record.vehicleType))];
          setUniqueTypes(types);

          const matricules = ["all", ...new Set(response.data.map((record) => record.matricule))];
          setUniqueMatricules(matricules);
        } else {
          console.log("No data returned from API");
          setData([]);
          setUniqueTypes(["all"]);
          setUniqueMatricules(["all"]);
        }

        if (response.error) {
          console.error("API Error:", response.error);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setData([]);
        setUniqueTypes(["all"]);
        setUniqueMatricules(["all"]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [filters]);

  // Filter data based on selections
  useEffect(() => {
    let filtered = [...data];

    // Filter by vehicle type
    if (selectedType !== "all") {
      filtered = filtered.filter((record) => record.vehicleType === selectedType);
    }

    // Filter by matricule
    if (selectedMatricule !== "all") {
      filtered = filtered.filter((record) => record.matricule === selectedMatricule);
    }

    // Filter by month
    if (selectedMonth !== "all") {
      filtered = filtered.filter((record) => record.month === selectedMonth);
    }

    setFilteredData(filtered);
  }, [data, selectedMonth, selectedType, selectedMatricule]);

  // Update available matricules when vehicle type changes
  useEffect(() => {
    let matricules = ["all"];
    if (selectedType === "all") {
      matricules = ["all", ...new Set(data.map((record) => record.matricule))];
    } else {
      matricules = [
        "all",
        ...new Set(
          data
            .filter((record) => record.vehicleType === selectedType)
            .map((record) => record.matricule)
        ),
      ];
    }
    setUniqueMatricules(matricules);
    setSelectedMatricule("all"); // Reset matricule selection
  }, [selectedType, data]);

  const formatValue = (value: number | undefined | null, unit: string): string => {
    if (value === undefined || value === null || isNaN(value)) return "N/A";
    switch (unit) {
      case "L":
        return `${value.toFixed(1)} L`;
      case "km":
        return `${value.toFixed(0)} km`;
      case "T":
        return `${value.toFixed(1)} T`;
      case "L/100km":
        return `${value.toFixed(2)} L/100km`;
      case "L/100km·T":
        return `${value.toFixed(4)} L/100km·T`;
      case "TND":
        return `${value.toFixed(2)} TND`;
      default:
        return `${value.toFixed(2)}`;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        <span>Chargement des données...</span>
      </div>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Détails par Véhicule</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4 mb-4">
          <div className="w-[200px]">
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger>
                <SelectValue placeholder="Type de véhicule" />
              </SelectTrigger>
              <SelectContent>
                {uniqueTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type === "all" ? "Tous les types" : type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-[200px]">
            <Select value={selectedMatricule} onValueChange={setSelectedMatricule}>
              <SelectTrigger>
                <SelectValue placeholder="Matricule" />
              </SelectTrigger>
              <SelectContent>
                {uniqueMatricules.map((matricule) => (
                  <SelectItem key={matricule} value={matricule}>
                    {matricule === "all" ? "Tous les matricules" : matricule}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-[200px]">
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger>
                <SelectValue placeholder="Mois" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les mois</SelectItem>
                {Object.entries(MONTH_NAMES).map(([key, value]) => (
                  <SelectItem key={key} value={key}>
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="relative overflow-x-auto">
          {filteredData.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <div className="text-gray-500 mb-2">
                <svg
                  className="w-12 h-12 mx-auto mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">
                Aucune donnée trouvée
              </h3>
              <p className="text-gray-500">
                Aucune donnée de véhicule trouvée pour les filtres sélectionnés.
              </p>
              <p className="text-sm text-gray-400 mt-2">
                Essayez de modifier les filtres ou vérifiez que des données existent pour cette période.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Matricule</TableHead>
                  <TableHead>Mois</TableHead>
                  <TableHead>Consommation</TableHead>
                  <TableHead>Kilométrage</TableHead>
                  <TableHead>IPE</TableHead>
                  {(selectedType === "all" || selectedType === "CAMION") && (
                    <>
                      <TableHead>Tonnage</TableHead>
                      <TableHead>IPE par Tonne</TableHead>
                    </>
                  )}
                  <TableHead>Coût</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map((record, index) => (
                  <TableRow key={`${record.matricule}-${record.month}-${index}`}>
                    <TableCell>{record.vehicleType}</TableCell>
                    <TableCell>{record.matricule}</TableCell>
                    <TableCell>{MONTH_NAMES[record.month] || record.month}</TableCell>
                    <TableCell>{formatValue(record.consommation, "L")}</TableCell>
                    <TableCell>{formatValue(record.kilometrage, "km")}</TableCell>
                    <TableCell>{formatValue(record.ipeL100km, "L/100km")}</TableCell>
                    {(selectedType === "all" || selectedType === "CAMION") && (
                      <>
                        <TableCell>{formatValue(record.tonnage, "T")}</TableCell>
                        <TableCell>
                          {formatValue(record.ipeL100TonneKm, "L/100km·T")}
                        </TableCell>
                      </>
                    )}
                    <TableCell>N/A</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
