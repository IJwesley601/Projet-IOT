"use client"

import { useState, useEffect } from "react"
import { doc, getDoc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { Thermometer, Droplets, Gauge, Wind, CloudRain, Sun, Bell } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { useInterval } from "@/hooks/use-interval"

interface AlertSettingsProps {
  userId: string
}

type AlertSettings = {
  temperature: { min: number; max: number; enabled: boolean }
  humidity: { min: number; max: number; enabled: boolean }
  pressure: { min: number; max: number; enabled: boolean }
  // windSpeed: { min: number; max: number; enabled: boolean }
  // rainfall: { min: number; max: number; enabled: boolean }
  // light: { min: number; max: number; enabled: boolean }
}

type NotificationPreferences = {
  email: boolean
  push: boolean
  sms: boolean
}

export default function AlertSettings({ userId }: AlertSettingsProps) {
  const [alertSettings, setAlertSettings] = useState<AlertSettings>({
    temperature: { min: 0, max: 40, enabled: true },
    humidity: { min: 20, max: 80, enabled: true },
    pressure: { min: 980, max: 1040, enabled: true },
    // windSpeed: { min: 0, max: 50, enabled: true },
    // rainfall: { min: 0, max: 10, enabled: true },
    // light: { min: 0, max: 100, enabled: true },
  })

  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPreferences>({
    email: true,
    push: false,
    sms: false,
  })

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [currentData, setCurrentData] = useState<Record<string, number>>({})

  // Récupérer les paramètres utilisateur
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const userDoc = await getDoc(doc(db, "users", userId))
        if (userDoc.exists()) {
          const userData = userDoc.data()
          if (userData.alertSettings) {
            setAlertSettings(userData.alertSettings)
          }
          if (userData.notificationPreferences) {
            setNotificationPrefs(userData.notificationPreferences)
          }
        }
      } catch (error) {
        console.error("Error fetching alert settings:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchSettings()
  }, [userId])

  // Simuler des données météo en temps réel (remplacez par une API réelle)
  useInterval(() => {
    setCurrentData({
      temperature: Math.random() * 50 - 10, // -10°C à 40°C
      humidity: Math.random() * 100, // 0% à 100%
      pressure: Math.random() * 70 + 980, // 980 hPa à 1050 hPa
      windSpeed: Math.random() * 50, // 0 km/h à 50 km/h
      rainfall: Math.random() * 10, // 0 mm à 10 mm
      light: Math.random() * 100, // 0% à 100%
    })
  }, 5000) // Mettre à jour toutes les 5 secondes

  // Vérifier les alertes en temps réel
  useEffect(() => {
    Object.entries(alertSettings).forEach(([key, setting]) => {
      if (setting.enabled && currentData[key] !== undefined) {
        if (currentData[key] < setting.min || currentData[key] > setting.max) {
          triggerAlert(key, currentData[key])
        }
      }
    })
  }, [currentData, alertSettings])

  // Déclencher une alerte
  const triggerAlert = (type: string, value: number) => {
    const message = `Alerte ${type}: ${value}`
    if (notificationPrefs.email) {
      console.log(`Envoi d'un email: ${message}`)
    }
    if (notificationPrefs.push) {
      console.log(`Envoi d'une notification push: ${message}`)
    }
    if (notificationPrefs.sms) {
      console.log(`Envoi d'un SMS: ${message}`)
    }
    toast({
      title: `Alerte ${type}`,
      description: `La valeur actuelle est ${value}.`,
      variant: "destructive",
    })
  }

  // Sauvegarder les paramètres
  const handleSaveSettings = async () => {
    setSaving(true)
    try {
      await updateDoc(doc(db, "users", userId), {
        alertSettings,
        notificationPreferences: notificationPrefs,
      })
      toast({
        title: "Paramètres enregistrés",
        description: "Vos paramètres d'alerte ont été mis à jour avec succès.",
      })
    } catch (error) {
      console.error("Error saving settings:", error)
      toast({
        title: "Erreur",
        description: "Une erreur s'est produite lors de l'enregistrement des paramètres.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  // Mettre à jour un paramètre
  const updateSetting = (type: keyof AlertSettings, field: "min" | "max" | "enabled", value: number | boolean) => {
    setAlertSettings((prev) => ({
      ...prev,
      [type]: {
        ...prev[type],
        [field]: value,
      },
    }))
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Paramètres d'alerte</h1>
        <Button onClick={handleSaveSettings} disabled={saving}>
          {saving ? "Enregistrement..." : "Enregistrer les modifications"}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Préférences de notification</CardTitle>
          <CardDescription>Choisissez comment vous souhaitez recevoir les alertes</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Bell className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="email-notifications">Notifications par email</Label>
            </div>
            <Switch
              id="email-notifications"
              checked={notificationPrefs.email}
              onCheckedChange={(checked) => setNotificationPrefs((prev) => ({ ...prev, email: checked }))}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Bell className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="push-notifications">Notifications push</Label>
            </div>
            <Switch
              id="push-notifications"
              checked={notificationPrefs.push}
              onCheckedChange={(checked) => setNotificationPrefs((prev) => ({ ...prev, push: checked }))}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Bell className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="sms-notifications">Notifications SMS</Label>
            </div>
            <Switch
              id="sms-notifications"
              checked={notificationPrefs.sms}
              onCheckedChange={(checked) => setNotificationPrefs((prev) => ({ ...prev, sms: checked }))}
            />
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="temperature">
        <TabsList className="grid grid-cols-3 md:grid-cols-6">
          <TabsTrigger value="temperature">Température</TabsTrigger>
          <TabsTrigger value="humidity">Humidité</TabsTrigger>
          <TabsTrigger value="pressure">Pression</TabsTrigger>
          <TabsTrigger value="windSpeed">Vent</TabsTrigger>
          <TabsTrigger value="rainfall">Pluie</TabsTrigger>
          <TabsTrigger value="light">Luminosité</TabsTrigger>
        </TabsList>

        <TabsContent value="temperature">
          <AlertSettingCard
            title="Température"
            description="Définir les seuils d'alerte pour la température"
            icon={<Thermometer className="h-5 w-5 text-red-500" />}
            min={alertSettings.temperature.min}
            max={alertSettings.temperature.max}
            enabled={alertSettings.temperature.enabled}
            unit="°C"
            minRange={-20}
            maxRange={50}
            step={1}
            onChange={(field, value) => updateSetting("temperature", field, value)}
          />
        </TabsContent>

        <TabsContent value="humidity">
          <AlertSettingCard
            title="Humidité"
            description="Définir les seuils d'alerte pour l'humidité"
            icon={<Droplets className="h-5 w-5 text-blue-500" />}
            min={alertSettings.humidity.min}
            max={alertSettings.humidity.max}
            enabled={alertSettings.humidity.enabled}
            unit="%"
            minRange={0}
            maxRange={100}
            step={1}
            onChange={(field, value) => updateSetting("humidity", field, value)}
          />
        </TabsContent>

        <TabsContent value="pressure">
          <AlertSettingCard
            title="Pression"
            description="Définir les seuils d'alerte pour la pression atmosphérique"
            icon={<Gauge className="h-5 w-5 text-purple-500" />}
            min={alertSettings.pressure.min}
            max={alertSettings.pressure.max}
            enabled={alertSettings.pressure.enabled}
            unit="hPa"
            minRange={950}
            maxRange={1050}
            step={1}
            onChange={(field, value) => updateSetting("pressure", field, value)}
          />
        </TabsContent>

        {/* <TabsContent value="windSpeed">
          <AlertSettingCard
            title="Vent"
            description="Définir les seuils d'alerte pour la vitesse du vent"
            icon={<Wind className="h-5 w-5 text-cyan-500" />}
            min={alertSettings.windSpeed.min}
            max={alertSettings.windSpeed.max}
            enabled={alertSettings.windSpeed.enabled}
            unit="km/h"
            minRange={0}
            maxRange={100}
            step={1}
            onChange={(field, value) => updateSetting("windSpeed", field, value)}
          />
        </TabsContent>

        <TabsContent value="rainfall">
          <AlertSettingCard
            title="Précipitations"
            description="Définir les seuils d'alerte pour les précipitations"
            icon={<CloudRain className="h-5 w-5 text-blue-600" />}
            min={alertSettings.rainfall.min}
            max={alertSettings.rainfall.max}
            enabled={alertSettings.rainfall.enabled}
            unit="mm"
            minRange={0}
            maxRange={50}
            step={0.5}
            onChange={(field, value) => updateSetting("rainfall", field, value)}
          />
        </TabsContent>

        <TabsContent value="light">
          <AlertSettingCard
            title="Luminosité"
            description="Définir les seuils d'alerte pour la luminosité"
            icon={<Sun className="h-5 w-5 text-yellow-500" />}
            min={alertSettings.light.min}
            max={alertSettings.light.max}
            enabled={alertSettings.light.enabled}
            unit="%"
            minRange={0}
            maxRange={100}
            step={1}
            onChange={(field, value) => updateSetting("light", field, value)}
          />
        </TabsContent> */}
      </Tabs>
    </div>
  )
}

interface AlertSettingCardProps {
  title: string
  description: string
  icon: React.ReactNode
  min: number
  max: number
  enabled: boolean
  unit: string
  minRange: number
  maxRange: number
  step: number
  onChange: (field: "min" | "max" | "enabled", value: number | boolean) => void
}

function AlertSettingCard({
  title,
  description,
  icon,
  min,
  max,
  enabled,
  unit,
  minRange,
  maxRange,
  step,
  onChange,
}: AlertSettingCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {icon}
            <CardTitle>{title}</CardTitle>
          </div>
          <Switch checked={enabled} onCheckedChange={(checked) => onChange("enabled", checked)} />
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="flex justify-between">
            <Label>Seuil minimum</Label>
            <span className="text-sm font-medium">
              {min} {unit}
            </span>
          </div>
          <Slider
            disabled={!enabled}
            value={[min]}
            min={minRange}
            max={maxRange}
            step={step}
            onValueChange={(value) => onChange("min", value[0])}
          />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between">
            <Label>Seuil maximum</Label>
            <span className="text-sm font-medium">
              {max} {unit}
            </span>
          </div>
          <Slider
            disabled={!enabled}
            value={[max]}
            min={minRange}
            max={maxRange}
            step={step}
            onValueChange={(value) => onChange("max", value[0])}
          />
        </div>

        <div className="p-3 bg-muted rounded-md">
          <p className="text-sm text-muted-foreground">
            Vous recevrez une alerte lorsque la valeur sera inférieure à {min} {unit} ou supérieure à {max} {unit}.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}