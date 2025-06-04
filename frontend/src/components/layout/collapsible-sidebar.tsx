"use client"

import { useLayout } from "@/context/layout-context"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import {
  Car,
  FileText,
  History,
  Home,
  LineChart,
  Menu,
  PenLine,
  Settings,
  Upload,
  X
} from "lucide-react"
import dynamic from 'next/dynamic'
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"

// Use path string for SVG instead of importing as a module
const logo = "/images/coficab-logo-light.svg"

// Dynamically import Logo component
const Logo = dynamic(() => import('@/components/ui/logo').then(mod => mod.Logo), {
  ssr: false,
})

interface SidebarProps {
  className?: string
}

export function CollapsibleSidebar({ className }: SidebarProps) {
  const { isSidebarCollapsed, toggleSidebar } = useLayout()
  const pathname = usePathname()

  const navItems = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: <Home className="h-5 w-5" />,
    },
    {
      name: "Véhicules",
      href: "/analyse-detailles",
      icon: <Car className="h-5 w-5" />,
    },
    {
      name: "Saisie Manuelle",
      href: "/saisie-manuelle",
      icon: <PenLine className="h-5 w-5" />,
    },
    {
      name: "Historique",
      href: "/historique",
      icon: <History className="h-5 w-5" />,
    },
    {
      name: "Situation Énergétique de Référence",
      href: "/situation-energ-ref",
      icon: <LineChart className="h-5 w-5" />,
    },
    {
      name: "Rapports",
      href: "/reports",
      icon: <FileText className="h-5 w-5" />,
    },
    {
      name: "Upload",
      href: "/upload",
      icon: <Upload className="h-5 w-5" />,
    },
    {
      name: "Paramètres",
      href: "/settings",
      icon: <Settings className="h-5 w-5" />,
    },
  ]

  return (
    <motion.div
      initial={false}
      animate={{ width: isSidebarCollapsed ? 80 : 280 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className={cn(
        "fixed left-0 top-0 z-20 flex h-full flex-col border-r border-[#E5E7EB] dark:border-[#4A5568] bg-white dark:bg-[#1A202C] shadow-sm",
        className
      )}
      style={{
        width: "280px"
      }}
    >
      <div className="flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          {isSidebarCollapsed ? (
            <Logo iconOnly={true} className="h-8 w-8" />
          ) : (
            <>
              <Logo iconOnly={true} className="h-8 w-8" />
              <span className="text-lg font-bold text-[#2D3748] dark:text-[#F7FAFC]">
                COFICAB ENERGIX
              </span>
            </>
          )}
        </div>
        <button
          onClick={toggleSidebar}
          className="ml-auto rounded-full p-2 text-[#6B7280] hover:bg-[#F3F4F6] dark:text-[#A0AEC0] dark:hover:bg-[#2D3748] transition-colors"
        >
          {isSidebarCollapsed ? (
            <Menu className="h-5 w-5" />
          ) : (
            <X className="h-5 w-5" />
          )}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-1 px-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                pathname === item.href
                  ? "bg-[#F3F4F6] text-[#4CAF50] dark:bg-[#2D3748] dark:text-[#48BB78]"
                  : "text-[#6B7280] hover:bg-[#F9FAFB] hover:text-[#4CAF50] dark:text-[#A0AEC0] dark:hover:bg-[#2D3748] dark:hover:text-[#48BB78]"
              )}
            >
              <div className="mr-3 flex-shrink-0">{item.icon}</div>
              {!isSidebarCollapsed && <span>{item.name}</span>}
            </Link>
          ))}
        </nav>
      </div>

      <div className="border-t border-[#E5E7EB] dark:border-[#4A5568] p-4">
        {!isSidebarCollapsed && (
          <div className="text-xs text-[#6B7280] dark:text-[#A0AEC0]">
            <Image
              src={logo}
              alt="COFICAB Logo"
              width={200}
              height={400}
              className="mb-2"
            />
            <p>COFICAB ENERGIX</p>
            <p className="mt-1">2025 @ COFICAB</p>
          </div>
        )}
      </div>
    </motion.div>
  )
}
