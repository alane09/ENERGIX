import { UploadedFile } from "@/app/historique/types"

class FileHistoryService {
  private baseUrl = '/api/files'

  async getFiles(): Promise<UploadedFile[]> {
    const response = await fetch(`${this.baseUrl}/history`, {
      credentials: 'include'
    })
    if (!response.ok) {
      throw new Error('Failed to fetch files')
    }
    return response.json()
  }

  async downloadFile(fileId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/${fileId}/download`, {
      credentials: 'include'
    })
    if (!response.ok) {
      throw new Error('Failed to download file')
    }
    
    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `file-${fileId}.xlsx` // Default name, server should provide actual name
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }

  async deleteFile(fileId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/${fileId}/delete`, {
      method: 'DELETE',
      credentials: 'include'
    })
    if (!response.ok) {
      throw new Error('Failed to delete file')
    }
  }
}

export const FileHistoryAPI = new FileHistoryService()
