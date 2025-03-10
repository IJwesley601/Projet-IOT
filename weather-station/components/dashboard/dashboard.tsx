"use client"

import { useState, useEffect } from "react"
import type { User } from "firebase/auth"
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import Navbar from "@/components/dashboard/navbar"
import WeatherDisplay from "@/components/dashboard/weather-display"
import AlertSettings from "@/components/dashboard/alert-settings"
import HistoryView from "@/components/dashboard/history-view"
import AdminPanel from "@/components/dashboard/admin-panel"
import LoadingSpinner from "@/components/ui/loading-spinner"
import  WeatherPredictions  from "@/components/dashboard/WeatherPredictions"

interface DashboardProps {
  user: User
}

type UserData = {
  name: string
  email: string
  role: "user" | "admin"
  alertSettings: {
    temperature: { min: number; max: number; enabled: boolean }
    humidity: { min: number; max: number; enabled: boolean }
    pressure: { min: number; max: number; enabled: boolean }
  }
  notificationPreferences: {
    email: boolean
    push: boolean
  }
}

export default function Dashboard({ user }: DashboardProps) {
  const [activeTab, setActiveTab] = useState("dashboard")
  const [userData, setUserData] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid))
        if (userDoc.exists()) {
          setUserData(userDoc.data() as UserData)
        }
      } catch (error) {
        console.error("Error fetching user data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()
  }, [user.uid])

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} activeTab={activeTab} setActiveTab={setActiveTab} isAdmin={userData?.role === "admin"} />

      <main className="container mx-auto px-4 py-6">
        {activeTab === "dashboard" && <WeatherDisplay />}
        {activeTab === "prediction" && <WeatherPredictions/>}
        {activeTab === "alerts" && <AlertSettings userId={user.uid} />}
        {activeTab === "history" && <HistoryView />}
        {activeTab === "admin" && userData?.role === "admin" && <AdminPanel />}
      </main>
    </div>
  )
}

