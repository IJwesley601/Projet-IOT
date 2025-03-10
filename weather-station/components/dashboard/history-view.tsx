"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DatePicker } from "@/components/ui/date-picker"
import { Button } from "@/components/ui/button"
import { Thermometer, Droplets, Wind, Gauge, Sun, CloudRain, Download } from "lucide-react"
import WeatherChart from "@/components/dashboard/weather-chart"

type WeatherData = {
  timestamp: { seconds: number }
  temperature: number
  humidity: number
  pressure: number
  windSpeed: number
  windDirection: number
  rainfall: number
  light: number
}

export default function HistoryView() {
  const [historicalData, setHistoricalData] = useState<WeatherData[]>([])
  const [loading, setLoading] = useState(true)
  const [startDate, setStartDate] = useState<Date | undefined>(
    new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 jours par défaut
  )
  const [endDate, setEndDate] = useState<Date | undefined>(new Date())

  const fetchHistoricalDataFromThingSpeak = async (startDate: Date, endDate: Date) => {
    const channelId = "2869518"; // Remplacez par votre ID de canal
    const readApiKey = "MZYCBLKPZ1IP9YHR"; // Remplacez par votre clé API de lecture
    const start = startDate.toISOString().split("T")[0]; // Format YYYY-MM-DD
    const end = endDate.toISOString().split("T")[0]; // Format YYYY-MM-DD
    const url = `https://api.thingspeak.com/channels/${channelId}/feeds.json?api_key=${readApiKey}&start=${start}&end=${end}`;

    try {
      const response = await fetch(url);
      const data = await response.json();
      console.log("Data from ThingSpeak:", data); // Inspectez les données ici

      if (data.feeds && data.feeds.length > 0) {
        const historicalData = data.feeds.map((feed: any) => ({
          timestamp: { seconds: new Date(feed.created_at).getTime() / 1000 },
          temperature: parseFloat(feed.field1) || 0, // field1 = température
          humidity: parseFloat(feed.field2) || 0,    // field2 = humidité
          pressure: parseFloat(feed.field3) || 0,    // field3 = pression
          windSpeed: parseFloat(feed.field4) || 0,   // field4 = vitesse du vent
          windDirection: parseFloat(feed.field5) || 0, // field5 = direction du vent
          rainfall: parseFloat(feed.field6) || 0,    // field6 = précipitations
          light: parseFloat(feed.field7) || 0,       // field7 = luminosité
        }));
        setHistoricalData(historicalData);
      } else {
        // Générer des données de démonstration si aucune donnée n'est disponible
        setHistoricalData(generateMockData(startDate, endDate));
      }
    } catch (error) {
      console.error("Error fetching historical data from ThingSpeak:", error);
      // Générer des données de démonstration en cas d'erreur
      setHistoricalData(generateMockData(startDate, endDate));
    } finally {
      setLoading(false);
    }
  };

  const fetchHistoricalData = async () => {
    setLoading(true);

    // Utiliser les dates sélectionnées ou les valeurs par défaut
    const start = startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 jours par défaut
    const end = endDate || new Date();

    // Récupérer les données depuis ThingSpeak
    await fetchHistoricalDataFromThingSpeak(start, end);
  };

  useEffect(() => {
    fetchHistoricalData();
  }, []);

  const handleExportData = () => {
    // Format data for CSV export
    const csvData = historicalData.map((item) => {
      const date = new Date(item.timestamp.seconds * 1000)
      return {
        date: date.toLocaleDateString(),
        time: date.toLocaleTimeString(),
        temperature: item.temperature,
        humidity: item.humidity,
        pressure: item.pressure,
        windSpeed: item.windSpeed,
        windDirection: item.windDirection,
        rainfall: item.rainfall,
        light: item.light,
      }
    })

    // Convert to CSV
    const headers = Object.keys(csvData[0]).join(",")
    const rows = csvData.map((row) => Object.values(row).join(","))
    const csv = [headers, ...rows].join("\n")

    // Create download link
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `weather_data_${new Date().toISOString().split("T")[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Historique des données</h1>

        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm">Du:</span>
            <DatePicker date={startDate} setDate={setStartDate} />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm">Au:</span>
            <DatePicker date={endDate} setDate={setEndDate} />
          </div>

          <Button onClick={fetchHistoricalData} disabled={loading}>
            {loading ? "Chargement..." : "Afficher"}
          </Button>

          <Button variant="outline" onClick={handleExportData} disabled={loading || historicalData.length === 0}>
            <Download className="mr-2 h-4 w-4" />
            Exporter
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : (
        <Tabs defaultValue="temperature" className="w-full">
          <TabsList className="grid grid-cols-3 md:grid-cols-4">
            <TabsTrigger value="temperature">Température</TabsTrigger>
            <TabsTrigger value="humidity">Humidité</TabsTrigger>
            <TabsTrigger value="pressure">Pression</TabsTrigger>
            <TabsTrigger value="wind">Vent</TabsTrigger>
            {/* <TabsTrigger value="rainfall">Précipitations</TabsTrigger>
            <TabsTrigger value="light">Luminosité</TabsTrigger> */}
          </TabsList>

          <TabsContent value="temperature">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Thermometer className="mr-2 h-5 w-5 text-red-500" />
                  Historique de température
                </CardTitle>
              </CardHeader>
              <CardContent>
                <WeatherChart data={historicalData} dataKey="temperature" color="#ef4444" unit="°C" />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="humidity">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Droplets className="mr-2 h-5 w-5 text-blue-500" />
                  Historique d'humidité
                </CardTitle>
              </CardHeader>
              <CardContent>
                <WeatherChart data={historicalData} dataKey="humidity" color="#3b82f6" unit="%" />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pressure">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Gauge className="mr-2 h-5 w-5 text-purple-500" />
                  Historique de pression
                </CardTitle>
              </CardHeader>
              <CardContent>
                <WeatherChart data={historicalData} dataKey="pressure" color="#8b5cf6" unit="hPa" />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="wind">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Wind className="mr-2 h-5 w-5 text-cyan-500" />
                  Historique du vent
                </CardTitle>
              </CardHeader>
              <CardContent>
                <WeatherChart data={historicalData} dataKey="windSpeed" color="#06b6d4" unit="km/h" />
              </CardContent>
            </Card>
          </TabsContent>

          {/* <TabsContent value="rainfall">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CloudRain className="mr-2 h-5 w-5 text-blue-600" />
                  Historique des précipitations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <WeatherChart data={historicalData} dataKey="rainfall" color="#2563eb" unit="mm" />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="light">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Sun className="mr-2 h-5 w-5 text-yellow-500" />
                  Historique de luminosité
                </CardTitle>
              </CardHeader>
              <CardContent>
                <WeatherChart data={historicalData} dataKey="light" color="#eab308" unit="%" />
              </CardContent>
            </Card>
          </TabsContent> */}
        </Tabs>
      )}
    </div>
  )
}

// Helper function to generate mock data for demo purposes
function generateMockData(startDate: Date, endDate: Date): WeatherData[] {
  const data: WeatherData[] = []
  const dayDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
  const pointsPerDay = 24 // One point per hour

  for (let i = 0; i < dayDiff * pointsPerDay; i++) {
    const timestamp = new Date(startDate)
    timestamp.setHours(timestamp.getHours() + i)

    // Generate some realistic patterns
    const hour = timestamp.getHours()
    const dayProgress = hour / 24

    // Temperature follows a daily cycle (cooler at night, warmer during day)
    const baseTemp = 15 + 10 * Math.sin(dayProgress * 2 * Math.PI - Math.PI / 2)
    const temperature = baseTemp + (Math.random() * 4 - 2)

    // Humidity is inverse to temperature
    const baseHumidity = 60 - 20 * Math.sin(dayProgress * 2 * Math.PI - Math.PI / 2)
    const humidity = Math.min(100, Math.max(0, baseHumidity + (Math.random() * 10 - 5)))

    // Other values with some randomness
    data.push({
      timestamp: { seconds: timestamp.getTime() / 1000 },
      temperature,
      humidity,
      pressure: 1013 + Math.random() * 10 - 5,
      windSpeed: 5 + Math.random() * 15,
      windDirection: Math.floor(Math.random() * 360),
      rainfall: Math.random() < 0.2 ? Math.random() * 5 : 0, // 20% chance of rain
      light: hour >= 6 && hour <= 18 ? 50 + Math.random() * 50 : Math.random() * 20, // Daylight hours
    })
  }

  return data
}