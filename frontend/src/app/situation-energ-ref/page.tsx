import { Metadata } from "next";
import { RegressionClient } from "./components/regression-client";

export const metadata: Metadata = {
  title: "Situation Énergétique de Référence",
  description: "Analyse de régression pour la consommation énergétique des véhicules",
};

export default function SituationEnergRefPage() {
  return (
    <main>
      <RegressionClient />
    </main>
  );
}
