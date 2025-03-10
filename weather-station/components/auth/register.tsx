"use client"

import type React from "react"

import { useState } from "react"
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth"
import { doc, setDoc } from "firebase/firestore"
import { auth, db } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface RegisterProps {
  switchToLogin: () => void
}

export default function Register({ switchToLogin }: RegisterProps) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas")
      return
    }

    setLoading(true)

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const user = userCredential.user

      // Update profile with display name
      await updateProfile(user, { displayName: name })

      // Create user document in Firestore
      await setDoc(doc(db, "users", user.uid), {
        name,
        email,
        role: "user",
        createdAt: new Date(),
        alertSettings: {
          temperature: { min: 0, max: 40, enabled: true },
          humidity: { min: 20, max: 80, enabled: true },
          pressure: { min: 980, max: 1040, enabled: true },
        },
        notificationPreferences: {
          email: true,
          push: false,
        },
      })
    } catch (err: any) {
      setError(err.message || "Une erreur s'est produite lors de l'inscription")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-center">Inscription</h2>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleRegister} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nom</Label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Votre nom" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="register-email">Email</Label>
          <Input
            id="register-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="votre@email.com"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="register-password">Mot de passe</Label>
          <Input
            id="register-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="••••••••"
            minLength={6}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirm-password">Confirmer le mot de passe</Label>
          <Input
            id="confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            placeholder="••••••••"
          />
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Inscription en cours..." : "S'inscrire"}
        </Button>
      </form>

      <div className="text-center text-sm">
        <span className="text-muted-foreground">Déjà un compte? </span>
        <button onClick={switchToLogin} className="text-primary hover:underline" type="button">
          Se connecter
        </button>
      </div>
    </div>
  )
}

