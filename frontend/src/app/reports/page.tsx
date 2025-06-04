import { Skeleton } from "@/components/ui/skeleton"
import { API } from "@/lib/api"
import { ReportTemplate } from "@/types/report"
import { Metadata } from "next"
import { Suspense } from "react"
import { ReportGeneratorClient } from "./components/report-generator-client"
import { ReportsListClient } from "./components/reports-list-client"

export const metadata: Metadata = {
  title: "Rapports | COFICAB ENERGIX",
  description: "Génération et consultation des rapports d'analyse de consommation",
}

// Dynamic page with server-side data fetching
export const dynamic = 'force-dynamic'
export const revalidate = 1800 // Revalidate every 30 minutes

// Static report templates that don't change often
const reportTemplates: ReportTemplate[] = [
  {
    id: "consumption-analysis",
    name: "Analyse de consommation",
    description: "Analyse détaillée de la consommation de carburant",
    sections: {
      header: { logo: true, title: true, date: true, reportType: true },
      summary: { keyMetrics: true, highlights: true },
      dataAnalysis: { charts: true, tables: true },
      aiAnalysis: { trends: true, recommendations: true, predictions: true },
      footer: { pageNumber: true, companyInfo: true, timestamp: true }
    },
    styling: {
      primaryColor: "#4CAF50",
      secondaryColor: "#2196F3",
      fontFamily: "helvetica",
      fontSize: 12,
      spacing: 1.5
    }
  },
  {
    id: "efficiency-report",
    name: "Rapport d'efficacité",
    description: "Analyse comparative de l'efficacité des véhicules",
    sections: {
      header: { logo: true, title: true, date: true, reportType: true },
      summary: { keyMetrics: true, highlights: true },
      dataAnalysis: { charts: true, tables: true },
      aiAnalysis: { trends: true, recommendations: true, predictions: true },
      footer: { pageNumber: true, companyInfo: true, timestamp: true }
    },
    styling: {
      primaryColor: "#2196F3",
      secondaryColor: "#4CAF50",
      fontFamily: "helvetica",
      fontSize: 12,
      spacing: 1.5
    }
  },
  {
    id: "ser-analysis",
    name: "Analyse SER",
    description: "Analyse de la situation énergétique de référence",
    sections: {
      header: { logo: true, title: true, date: true, reportType: true },
      summary: { keyMetrics: true, highlights: true },
      dataAnalysis: { charts: true, tables: true },
      aiAnalysis: { trends: true, recommendations: true, predictions: true },
      footer: { pageNumber: true, companyInfo: true, timestamp: true }
    },
    styling: {
      primaryColor: "#FF9800",
      secondaryColor: "#2196F3",
      fontFamily: "helvetica",
      fontSize: 12,
      spacing: 1.5
    }
  }
]

// Server-side data fetching for reports and vehicle types
async function fetchReportsData() {
  try {
    const savedReports = await API.Reports.getReports()
    const vehicleTypes = ["Camion", "Voiture", "Utilitaire"] // This would come from an API in production
    
    return {
      savedReports,
      vehicleTypes,
      reportTemplates // Using our static templates defined above
    }
  } catch (error) {
    console.error("Error fetching reports data:", error)
    return {
      savedReports: [],
      vehicleTypes: ["Camion", "Voiture", "Utilitaire"],
      reportTemplates
    }
  }
}

// Reports page skeleton for loading state
function ReportsPageSkeleton() {
  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-64" />
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Skeleton className="h-[400px] w-full rounded-lg" />
        <Skeleton className="h-[400px] w-full rounded-lg" />
      </div>
    </div>
  )
}

export default async function ReportsPage() {
  // Fetch dynamic data server-side
  const { savedReports, vehicleTypes } = await fetchReportsData()
  
  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-[#111827] dark:text-white">
          Rapports
        </h1>
      </div>
      
      <Suspense fallback={<ReportsPageSkeleton />}>
        <div className="grid gap-6 md:grid-cols-2">
          <ReportGeneratorClient reportTemplates={reportTemplates} vehicleTypes={vehicleTypes} />
          <ReportsListClient savedReports={savedReports} />
        </div>
      </Suspense>
    </div>
  )
}
