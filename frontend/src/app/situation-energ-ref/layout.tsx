import { YearProvider } from "@/context/year-context";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Situation Énergétique de Référence | Analyse de Consommation",
  description: "Analyse détaillée de la consommation énergétique de référence par type de véhicule avec régression linéaire",
  keywords: [
    "consommation énergétique",
    "régression linéaire",
    "analyse de véhicules",
    "efficacité énergétique",
    "camions",
    "voitures",
    "analyse de données",
  ],
};

export default function SituationEnergRefLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <YearProvider>
      <div className="container mx-auto py-6">
        <div className="flex-1 space-y-4">
          <div className="flex items-center justify-between space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">
              Situation Énergétique de Référence
            </h2>
          </div>
          {children}
        </div>
      </div>
    </YearProvider>
  );
}
