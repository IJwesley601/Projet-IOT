"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Thermometer, Droplets, Wind, Gauge, Sun, CloudRain } from "lucide-react"
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

export default function WeatherDisplay() {
  const [currentData, setCurrentData] = useState<WeatherData | null>(null)
  const [historicalData, setHistoricalData] = useState<WeatherData[]>([])
  const [loading, setLoading] = useState(true)

  // Fonction pour récupérer les données depuis ThingSpeak
  const fetchDataFromThingSpeak = async () => {
    const channelId = "2869518"; // Remplacez par votre ID de canal
    const readApiKey = "MZYCBLKPZ1IP9YHR"; // Remplacez par votre clé API de lecture
    const urlLatest = `https://api.thingspeak.com/channels/${channelId}/feeds.json?api_key=${readApiKey}&results=1`; // Dernier point de données
    const urlHistorical = `https://api.thingspeak.com/channels/${channelId}/feeds.json?api_key=${readApiKey}&results=24`; // 24 derniers points de données

    try {
      // Récupérer les dernières données
      const responseLatest = await fetch(urlLatest);
      const dataLatest = await responseLatest.json();
      if (dataLatest.feeds && dataLatest.feeds.length > 0) {
        const latestData = dataLatest.feeds[0];
        setCurrentData({
          timestamp: { seconds: new Date(latestData.created_at).getTime() / 1000 },
          temperature: parseFloat(latestData.field1),
          humidity: parseFloat(latestData.field2),
          pressure: parseFloat(latestData.field3),
          windSpeed: parseFloat(latestData.field4),
          windDirection: parseFloat(latestData.field5),
          rainfall: parseFloat(latestData.field6),
          light: parseFloat(latestData.field7),
        });
      }

      // Récupérer les données historiques
      const responseHistorical = await fetch(urlHistorical);
      const dataHistorical = await responseHistorical.json();
      if (dataHistorical.feeds && dataHistorical.feeds.length > 0) {
        const historicalData = dataHistorical.feeds.map((feed: any) => ({
          timestamp: { seconds: new Date(feed.created_at).getTime() / 1000 },
          temperature: parseFloat(feed.field1),
          humidity: parseFloat(feed.field2),
          pressure: parseFloat(feed.field3),
          windSpeed: parseFloat(feed.field4),
          windDirection: parseFloat(feed.field5),
          rainfall: parseFloat(feed.field6),
          light: parseFloat(feed.field7),
        }));
        setHistoricalData(historicalData.reverse()); // Inverser pour un ordre chronologique
      }
    } catch (error) {
      console.error("Error fetching data from ThingSpeak:", error);
    } finally {
      setLoading(false);
    }
  };

  // Charger les données au montage du composant
  useEffect(() => {
    fetchDataFromThingSpeak();
  }, []);

  // Générer des données de démonstration si aucune donnée n'est disponible
  useEffect(() => {
    if (loading && !currentData) {
      const mockData: WeatherData = {
        timestamp: { seconds: Date.now() / 1000 },
        temperature: 22.5,
        humidity: 65,
        pressure: 1013,
        windSpeed: 12,
        windDirection: 180,
        rainfall: 0,
        light: 75,
      };

      setCurrentData(mockData);

      const mockHistorical = Array.from({ length: 24 }, (_, i) => ({
        ...mockData,
        timestamp: { seconds: Date.now() / 1000 - i * 3600 },
        temperature: 20 + Math.random() * 5,
        humidity: 60 + Math.random() * 10,
        pressure: 1010 + Math.random() * 10,
        windSpeed: 10 + Math.random() * 5,
        rainfall: Math.random() < 0.3 ? Math.random() * 2 : 0,
      }));

      setHistoricalData(mockHistorical.reverse());
      setLoading(false);
    }
  }, [loading, currentData]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Tableau de bord météo</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Thermometer className="mr-2 h-4 w-4 text-red-500" />
              Température
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentData?.temperature.toFixed(1)}°C</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Droplets className="mr-2 h-4 w-4 text-blue-500" />
              Humidité
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentData?.humidity.toFixed(0)}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Gauge className="mr-2 h-4 w-4 text-purple-500" />
              Pression
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentData?.pressure.toFixed(0)} hPa</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Wind className="mr-2 h-4 w-4 text-cyan-500" />
              Vent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentData?.windSpeed.toFixed(1)} km/h</div>
            <div className="text-xs text-muted-foreground">
              Direction: {getWindDirection(currentData?.windDirection || 0)}
            </div>
          </CardContent>
        </Card>

        {/* <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <CloudRain className="mr-2 h-4 w-4 text-blue-600" />
              Précipitations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentData?.rainfall.toFixed(1)} mm</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Sun className="mr-2 h-4 w-4 text-yellow-500" />
              Luminosité
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentData?.light.toFixed(0)}%</div>
          </CardContent>
        </Card> */}
      </div>

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
              <CardTitle>Évolution de la température</CardTitle>
            </CardHeader>
            <CardContent>
              <WeatherChart data={historicalData} dataKey="temperature" color="#ef4444" unit="°C" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="humidity">
          <Card>
            <CardHeader>
              <CardTitle>Évolution de l'humidité</CardTitle>
            </CardHeader>
            <CardContent>
              <WeatherChart data={historicalData} dataKey="humidity" color="#3b82f6" unit="%" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pressure">
          <Card>
            <CardHeader>
              <CardTitle>Évolution de la pression</CardTitle>
            </CardHeader>
            <CardContent>
              <WeatherChart data={historicalData} dataKey="pressure" color="#8b5cf6" unit="hPa" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="wind">
          <Card>
            <CardHeader>
              <CardTitle>Évolution du vent</CardTitle>
            </CardHeader>
            <CardContent>
              <WeatherChart data={historicalData} dataKey="windSpeed" color="#06b6d4" unit="km/h" />
            </CardContent>
          </Card>
        </TabsContent>

        {/* <TabsContent value="rainfall">
          <Card>
            <CardHeader>
              <CardTitle>Évolution des précipitations</CardTitle>
            </CardHeader>
            <CardContent>
              <WeatherChart data={historicalData} dataKey="rainfall" color="#2563eb" unit="mm" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="light">
          <Card>
            <CardHeader>
              <CardTitle>Évolution de la luminosité</CardTitle>
            </CardHeader>
            <CardContent>
              <WeatherChart data={historicalData} dataKey="light" color="#eab308" unit="%" />
            </CardContent>
          </Card>
        </TabsContent> */}
      </Tabs>
    </div>
  );
}

function getWindDirection(degrees: number): string {
  const directions = ["N", "NE", "E", "SE", "S", "SO", "O", "NO"];
  const index = Math.round(degrees / 45) % 8;
  return directions[index];
}