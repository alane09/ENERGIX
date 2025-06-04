"use client"

import { cn } from "@/lib/utils"

interface ReportLogoProps {
  className?: string
  style?: React.CSSProperties
  size?: "sm" | "md" | "lg"
  type?: "icon" | "full"
}

/**
 * ReportLogo component that can be used in reports
 * This is optimized for embedding in PDF/DOCX/XLSX reports
 */
export function ReportLogo({ 
  className,
  style,
  size = "md",
  type = "full" 
}: ReportLogoProps) {
  // Determine which logo to use
  const logoSrc = type === "icon" 
    ? "/images/coficab-icon.svg" 
    : "/images/coficab-logo.svg"
  
  // Size mapping
  const sizeMap = {
    sm: type === "icon" ? { width: 24, height: 24 } : { width: 120, height: 30 },
    md: type === "icon" ? { width: 32, height: 32 } : { width: 180, height: 40 },
    lg: type === "icon" ? { width: 48, height: 48 } : { width: 240, height: 60 },
  }
  
  const { width, height } = sizeMap[size]
  
  return (
    <img 
      src={logoSrc}
      alt="COFICAB Logo" 
      width={width}
      height={height}
      style={{ ...style, maxWidth: '100%' }}
      className={cn("object-contain", className)}
    />
  )
}

/**
 * Convert a report logo to Base64 for embedding in reports
 */
export async function getReportLogoAsBase64(type: "icon" | "full" = "full"): Promise<string> {
  const logoPath = type === "icon" 
    ? "/images/coficab-icon.svg" 
    : "/images/coficab-logo.svg"
  
  try {
    // When running on the client side
    if (typeof window !== 'undefined') {
      const response = await fetch(logoPath)
      const blob = await response.blob()
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(blob)
      })
    } 
    // When running on the server side
    else {
      // This is a placeholder as we can't directly access files in Next.js server components
      // In a real implementation, you would use the fs module in a Node.js environment
      return ''
    }
  } catch (error) {
    console.error("Error converting logo to Base64:", error)
    return ''
  }
}
