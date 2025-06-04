"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileDown, FileText, Filter, Search, SortAsc } from "lucide-react"
import { useState } from "react"

interface SavedReport {
  id: string
  name: string
  type: string
  format: string
  dateGenerated: string
  downloadUrl: string
}

interface ReportsListClientProps {
  savedReports: SavedReport[]
}

export function ReportsListClient({ savedReports: initialReports }: ReportsListClientProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [formatFilter, setFormatFilter] = useState("all")
  const [sortBy, setSortBy] = useState("date")
  const [reports, setReports] = useState(initialReports)

  // Get unique report types and formats for filters
  const reportTypes = Array.from(new Set(reports.map(r => r.type)))
  const reportFormats = Array.from(new Set(reports.map(r => r.format)))

  // Filter and sort reports
  const filteredReports = reports
    .filter(report => {
      // Defensive: skip reports with missing name, type, or format
      if (!report.name || !report.type || !report.format) return false;
      const matchesSearch = report.name.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesType = typeFilter === "all" || report.type === typeFilter
      const matchesFormat = formatFilter === "all" || report.format === formatFilter
      return matchesSearch && matchesType && matchesFormat
    })
    .sort((a, b) => {
      if (sortBy === "date") {
        return new Date(b.dateGenerated).getTime() - new Date(a.dateGenerated).getTime()
      }
      return a.name.localeCompare(b.name)
    })

  const handleDownload = (report: SavedReport) => {
    // In a real app, this would trigger the download
    window.open(report.downloadUrl, "_blank")
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Rapports générés</CardTitle>
        <div className="flex flex-col gap-4 mt-4">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un rapport..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon">
              <SortAsc className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex gap-2">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Type de rapport" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                {reportTypes.map(type => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={formatFilter} onValueChange={setFormatFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les formats</SelectItem>
                {reportFormats.map(format => (
                  <SelectItem key={format} value={format}>
                    {format}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Trier par" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Date</SelectItem>
                <SelectItem value="name">Nom</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {filteredReports.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Aucun rapport trouvé
            </div>
          ) : (
            filteredReports.map(report => (
              <div
                key={report.id}
                className="flex items-center justify-between p-4 rounded-lg border"
              >
                <div className="flex items-center gap-3">
                  <FileText className="h-8 w-8 text-muted-foreground" />
                  <div>
                    <h4 className="font-medium">{report.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {new Date(report.dateGenerated).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground px-2 py-1 rounded-full bg-secondary">
                    {report.format}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDownload(report)}
                  >
                    <FileDown className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
