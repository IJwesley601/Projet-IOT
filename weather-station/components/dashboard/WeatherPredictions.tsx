"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, CloudRain, CloudLightning, Wind, Thermometer, Droplets, Gauge } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "@/hooks/use-toast"

interface WeatherPredictionsProps {
  channelId: string
  readApiKey: string
}

export default function WeatherPredictions({ channelId, readApiKey }: WeatherPredictionsProps) {
  const [weatherData, setWeatherData] = useState<Record<string, number>>({})
  const [historicalData, setHistoricalData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchDataFromThingSpeak = async () => {
    const url = `https://api.thingspeak.com/channels/2869518/feeds.json?api_key=MZYCBLKPZ1IP9YHR&results=24`

    try {
      const response = await fetch(url)
      const data = await response.json()

      if (data.feeds && data.feeds.length > 0) {
        const latestData = data.feeds[data.feeds.length - 1]
        setWeatherData({
          temperature: parseFloat(latestData.field1),
          humidity: parseFloat(latestData.field2),
          pressure: parseFloat(latestData.field3),
          windSpeed: parseFloat(latestData.field4),
          rainfall: parseFloat(latestData.field5),
          windDirection: parseFloat(latestData.field6),
        })

        const formattedData = data.feeds.map((feed: any) => ({
          hour: new Date(feed.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          temperature: parseFloat(feed.field1),
          humidity: parseFloat(feed.field2),
          windSpeed: parseFloat(feed.field4),
          rainfall: parseFloat(feed.field5),
        }))
        setHistoricalData(formattedData)
      }
    } catch (error) {
      console.error("Error fetching data from ThingSpeak:", error)
      toast({
        title: "Erreur",
        description: "Impossible de récupérer les données météo.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (weatherData.temperature > 35) {
      toast({
        title: "Alerte Canicule",
        description: `Température élevée: ${weatherData.temperature}°C`,
        variant: "destructive",
      })
    }
    if (weatherData.rainfall > 5) {
      toast({
        title: "Alerte Forte Pluie",
        description: `Précipitations élevées: ${weatherData.rainfall} mm`,
        variant: "destructive",
      })
    }
    if (weatherData.windSpeed > 30) {
      toast({
        title: "Alerte Tempête",
        description: `Vent fort: ${weatherData.windSpeed} km/h`,
        variant: "destructive",
      })
    }
  }, [weatherData])

  useEffect(() => {
    fetchDataFromThingSpeak()
    const interval = setInterval(fetchDataFromThingSpeak, 60000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <Card className="w-full h-screen">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CloudLightning className="h-5 w-5 text-yellow-500" />
          Prédictions météo
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-2">
            <Thermometer className="h-5 w-5 text-red-500" />
            <span>Température: {weatherData.temperature}°C</span>
          </div>
          <div className="flex items-center gap-2">
            <Droplets className="h-5 w-5 text-blue-500" />
            <span>Humidité: {weatherData.humidity}%</span>
          </div>
          <div className="flex items-center gap-2">
            <Gauge className="h-5 w-5 text-purple-500" />
            <span>Pression: {weatherData.pressure} hPa</span>
          </div>
          <div className="flex items-center gap-2">
            <Wind className="h-5 w-5 text-cyan-500" />
            <span>Vent: {weatherData.windSpeed} km/h</span>
          </div>
          <div className="flex items-center gap-2">
            <CloudRain className="h-5 w-5 text-blue-600" />
            <span>Pluie: {weatherData.rainfall} mm</span>
          </div>
        </div>
        <div className="mt-4">
          <h3 className="text-lg font-semibold mb-2">Prévisions sur 24 heures</h3>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={historicalData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="temperature" stroke="#ef4444" name="Température (°C)" />
              <Line type="monotone" dataKey="humidity" stroke="#3b82f6" name="Humidité (%)" />
              <Line type="monotone" dataKey="windSpeed" stroke="#10b981" name="Vitesse du vent (km/h)" />
              <Line type="monotone" dataKey="rainfall" stroke="#6366f1" name="Précipitations (mm)" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
