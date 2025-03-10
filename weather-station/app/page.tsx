"use client"

import { useEffect, useState } from "react"
import { onAuthStateChanged } from "firebase/auth"
import { auth } from "@/lib/firebase"
import Login from "@/components/auth/login"
import Register from "@/components/auth/register"
import Dashboard from "@/components/dashboard/dashboard"
import LoadingSpinner from "@/components/ui/loading-spinner"

export default function Home() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [authMode, setAuthMode] = useState<"login" | "register">("login")

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  if (loading) {
    return <LoadingSpinner />
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-lg">
          <h1 className="text-2xl font-bold text-center text-primary mb-6">Station Météo Intelligente</h1>

          {authMode === "login" ? (
            <Login switchToRegister={() => setAuthMode("register")} />
          ) : (
            <Register switchToLogin={() => setAuthMode("login")} />
          )}
        </div>
      </div>
    )
  }

  return <Dashboard user={user} />
}

