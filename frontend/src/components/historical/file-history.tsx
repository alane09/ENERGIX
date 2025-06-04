"use client"

import { UploadedFile } from "@/app/historique/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import {
    Download,
    Eye,
    FileText,
    Loader2,
    Trash
} from "lucide-react"

interface FileHistoryProps {
  files: UploadedFile[]
  onDownload: (fileId: string) => void
  onDelete: (fileId: string) => void
  onView: (fileId: string) => void
  isDownloading: boolean
  downloadingFileId: string | null
  isDeleting: boolean
  deletingFileId: string | null
}

export function FileHistory({
  files,
  onDownload,
  onDelete,
  onView,
  isDownloading,
  downloadingFileId,
  isDeleting,
  deletingFileId
}: FileHistoryProps) {
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getVehicleTypeIcon = (type?: string) => {
    switch (type?.toLowerCase()) {
      case 'camions':
        return '🚛'
      case 'voitures':
        return '🚗'
      case 'chariots':
        return '🚜'
      default:
        return '📄'
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Historique des fichiers
        </CardTitle>
        <CardDescription>
          {files.length} fichier{files.length > 1 ? 's' : ''} importé{files.length > 1 ? 's' : ''}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {files.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Aucun fichier importé</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fichier</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Année</TableHead>
                <TableHead>Taille</TableHead>
                <TableHead>Date d'import</TableHead>
                <TableHead>Enregistrements</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {files.map((file) => (
                <TableRow key={file.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{getVehicleTypeIcon(file.vehicleType)}</span>
                      <div>
                        <p className="font-medium">{file.name || file.filename}</p>
                        <p className="text-sm text-muted-foreground">{file.filename}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {file.vehicleType ? (
                      <Badge variant="outline" className="capitalize">
                        {file.vehicleType}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {file.year ? (
                      <Badge variant="secondary">{file.year}</Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatFileSize(file.size)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(file.uploadDate), 'dd MMM yyyy à HH:mm', { locale: fr })}
                  </TableCell>
                  <TableCell>
                    {file.recordCount ? (
                      <Badge variant="outline">
                        {file.recordCount.toLocaleString('fr-FR')} enregistrements
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onView(file.id)}
                        className="h-8 w-8 p-0"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDownload(file.id)}
                        disabled={isDownloading && downloadingFileId === file.id}
                        className="h-8 w-8 p-0"
                      >
                        {isDownloading && downloadingFileId === file.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(file.id)}
                        disabled={isDeleting && deletingFileId === file.id}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                      >
                        {isDeleting && deletingFileId === file.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
