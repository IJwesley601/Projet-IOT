"use client"

import type { User } from "firebase/auth"
import { signOut } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Cloud, Bell, History, Settings, LogOut, UserIcon, Shield } from "lucide-react"

interface NavbarProps {
  user: User
  activeTab: string
  setActiveTab: (tab: string) => void
  isAdmin: boolean
}

export default function Navbar({ user, activeTab, setActiveTab, isAdmin }: NavbarProps) {
  const handleLogout = async () => {
    try {
      await signOut(auth)
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  return (
    <nav className="bg-white shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Cloud className="h-8 w-8 text-primary" />
            <span className="ml-2 text-xl font-bold text-primary">Station Météo</span>
          </div>

          <div className="hidden md:flex space-x-4">
            <Button variant={activeTab === "dashboard" ? "default" : "ghost"} onClick={() => setActiveTab("dashboard")}>
              <Cloud className="mr-2 h-4 w-4" />
              Tableau de bord
            </Button>

            <Button variant={activeTab === "prediction" ? "default" : "ghost"} onClick={() => setActiveTab("prediction")}>
              <Bell className="mr-2 h-4 w-4" />
              Prédiction AI
            </Button>

            <Button variant={activeTab === "alerts" ? "default" : "ghost"} onClick={() => setActiveTab("alerts")}>
              <Bell className="mr-2 h-4 w-4" />
              Alertes
            </Button>

            <Button variant={activeTab === "history" ? "default" : "ghost"} onClick={() => setActiveTab("history")}>
              <History className="mr-2 h-4 w-4" />
              Historique
            </Button>

            {isAdmin && (
              <Button variant={activeTab === "admin" ? "default" : "ghost"} onClick={() => setActiveTab("admin")}>
                <Shield className="mr-2 h-4 w-4" />
                Admin
              </Button>
            )}
          </div>

          <div className="flex items-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative rounded-full">
                  <UserIcon className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem className="font-medium">{user.displayName || user.email}</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setActiveTab("settings")}>
                  <Settings className="mr-2 h-4 w-4" />
                  Paramètres
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Déconnexion
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Mobile navigation */}
      <div className="md:hidden border-t">
        <div className="grid grid-cols-4 text-xs">
          <button
            className={`flex flex-col items-center justify-center py-2 ${
              activeTab === "dashboard" ? "text-primary" : "text-gray-500"
            }`}
            onClick={() => setActiveTab("dashboard")}
          >
            <Cloud className="h-5 w-5" />
            <span>Accueil</span>
          </button>

          <button
            className={`flex flex-col items-center justify-center py-2 ${
              activeTab === "prediction" ? "text-primary" : "text-gray-500"
            }`}
            onClick={() => setActiveTab("prediction")}
          >
            <Bell className="h-5 w-5" />
            <span>Prédictions</span>
          </button>

          <button
            className={`flex flex-col items-center justify-center py-2 ${
              activeTab === "alerts" ? "text-primary" : "text-gray-500"
            }`}
            onClick={() => setActiveTab("alerts")}
          >
            <Bell className="h-5 w-5" />
            <span>Alertes</span>
          </button>

          <button
            className={`flex flex-col items-center justify-center py-2 ${
              activeTab === "history" ? "text-primary" : "text-gray-500"
            }`}
            onClick={() => setActiveTab("history")}
          >
            <History className="h-5 w-5" />
            <span>Historique</span>
          </button>

          {isAdmin ? (
            <button
              className={`flex flex-col items-center justify-center py-2 ${
                activeTab === "admin" ? "text-primary" : "text-gray-500"
              }`}
              onClick={() => setActiveTab("admin")}
            >
              <Shield className="h-5 w-5" />
              <span>Admin</span>
            </button>
          ) : (
            <button
              className={`flex flex-col items-center justify-center py-2 ${
                activeTab === "settings" ? "text-primary" : "text-gray-500"
              }`}
              onClick={() => setActiveTab("settings")}
            >
              <Settings className="h-5 w-5" />
              <span>Paramètres</span>
            </button>
          )}
        </div>
      </div>
    </nav>
  )
}

