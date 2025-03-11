"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Thermometer, Droplets, Wind, Gauge, Sun, CloudRain, Clock, ChevronDown, ChevronUp } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from "recharts";

type ThingSpeakData = {
  timestamp: { seconds: number };
  temperature: number;
  humidity: number;
  pressure: number;
  windSpeed: number;
  windDirection: number;
  rainfall: number;
  light: number;
};

type OpenWeatherData = {
  timestamp: number;
  temperature: number;
  humidity: number;
  pressure: number;
  windSpeed: number;
  rainfall: number;
};

export default function WeatherDisplay() {
  const [currentThingSpeakData, setCurrentThingSpeakData] = useState<ThingSpeakData | null>(null);
  const [currentOpenWeatherData, setCurrentOpenWeatherData] = useState<OpenWeatherData | null>(null);
  const [historicalData, setHistoricalData] = useState<ThingSpeakData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCardOpen, setIsCardOpen] = useState(true);
  const [alert, setAlert] = useState<{ message: string; type: "info" | "warning" | "error" } | null>(null);

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
        const newData = {
          timestamp: { seconds: new Date(latestData.created_at).getTime() / 1000 },
          temperature: parseFloat(latestData.field1),
          humidity: parseFloat(latestData.field2),
          pressure: parseFloat(latestData.field3),
          windSpeed: parseFloat(latestData.field4),
          windDirection: parseFloat(latestData.field5),
          rainfall: parseFloat(latestData.field6),
          light: parseFloat(latestData.field7),
        };
        setCurrentThingSpeakData(newData);

        // Vérifier les conditions météorologiques pour l'alerte
        checkWeatherConditions(newData);
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
    }
  };

  // Fonction pour vérifier les conditions météorologiques
  const checkWeatherConditions = (data: ThingSpeakData) => {
    if (data.rainfall > 50) {
      setAlert({ message: "Alerte : Forte pluie aujourd'hui !", type: "warning" });
    } else if (data.windSpeed > 30) {
      setAlert({ message: "Alerte : Fort vent aujourd'hui !", type: "warning" });
    } else if (data.pressure < 1000) {
      setAlert({ message: "Alerte : Risque de cyclone aujourd'hui !", type: "error" });
    } else if (data.temperature > 30 && data.humidity < 50) {
      setAlert({ message: "Beau temps aujourd'hui !", type: "info" });
    }

    // Supprimer l'alerte après 10 secondes
    setTimeout(() => {
      setAlert(null);
    }, 10000); // 10 secondes
  };

  // Fonction pour récupérer les données météorologiques actuelles depuis OpenWeatherMap
  const fetchWeatherData = async (latitude: number, longitude: number) => {
    const apiKey = "38a3eebbd2fbb42d0af4554f414fe2a9"; // Remplacez par votre clé API OpenWeatherMap
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${apiKey}&units=metric&lang=fr`;

    try {
      const response = await fetch(url);
      const data = await response.json();
      if (data) {
        setCurrentOpenWeatherData({
          timestamp: data.dt,
          temperature: data.main.temp,
          humidity: data.main.humidity,
          pressure: data.main.pressure,
          windSpeed: data.wind.speed,
          rainfall: data.rain ? data.rain["1h"] || 0 : 0, // Précipitations sur la dernière heure
        });
      }
    } catch (error) {
      console.error("Error fetching weather data:", error);
    }
  };

  // Charger les données au montage du composant
  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      await fetchDataFromThingSpeak();

      // Utiliser des coordonnées fixes pour OpenWeatherMap
      const latitude = -21.4522;
      const longitude = 47.0859;
      await fetchWeatherData(latitude, longitude);

      setLoading(false);
    };

    fetchAllData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 relative">
      {/* Alerte météo */}
      {alert && (
        <div className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
          alert.type === "info"
            ? "bg-blue-100 text-blue-800"
            : alert.type === "warning"
            ? "bg-yellow-100 text-yellow-800"
            : "bg-red-100 text-red-800"
        }`}>
          <div className="flex items-center gap-2">
            {alert.type === "info" && <Sun className="h-5 w-5" />}
            {alert.type === "warning" && <CloudRain className="h-5 w-5" />}
            {alert.type === "error" && <Wind className="h-5 w-5" />}
            <span>{alert.message}</span>
          </div>
        </div>
      )}

      {/* Carte flottante de la météo actuelle (OpenWeatherMap uniquement) */}
      {currentOpenWeatherData && (
        <Card className="fixed top-16 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-md shadow-lg transition-all duration-300">
          <CardHeader
            className="cursor-pointer"
            onClick={() => setIsCardOpen(!isCardOpen)}
          >
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-500" />
                Fianarantsoa - {new Date(
                  currentOpenWeatherData.timestamp * 1000
                ).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </div>
              {isCardOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </CardTitle>
          </CardHeader>
          <CardContent
            className={`grid grid-cols-2 md:grid-cols-3 gap-4 transition-all duration-300 overflow-hidden ${
              isCardOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
            }`}
          >
            <div className="flex items-center gap-2">
              <Thermometer className="h-5 w-5 text-red-500" />
              <span>Température: {currentOpenWeatherData.temperature.toFixed(1)}°C</span>
            </div>
            <div className="flex items-center gap-2">
              <Droplets className="h-5 w-5 text-blue-500" />
              <span>Humidité: {currentOpenWeatherData.humidity.toFixed(0)}%</span>
            </div>
            <div className="flex items-center gap-2">
              <Gauge className="h-5 w-5 text-purple-500" />
              <span>Pression: {currentOpenWeatherData.pressure.toFixed(0)} hPa</span>
            </div>
            <div className="flex items-center gap-2">
              <Wind className="h-5 w-5 text-cyan-500" />
              <span>Vent: {currentOpenWeatherData.windSpeed.toFixed(1)} km/h</span>
            </div>
            <div className="flex items-center gap-2">
              <CloudRain className="h-5 w-5 text-blue-600" />
              <span>Précipitations: {currentOpenWeatherData.rainfall?.toFixed(1) || "0.0"} mm</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Contenu principal (ThingSpeak uniquement) */}
      <div className="space-y-6"> {/* Ajouter un padding en haut pour éviter que la carte flottante ne chevauche le contenu */}
        <h1 className="text-2xl font-bold">Tableau de bord météo</h1>

        {/* Cartes des données actuelles */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <Thermometer className="mr-2 h-4 w-4 text-red-500" />
                Température
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{currentThingSpeakData?.temperature.toFixed(1)}°C</div>
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
              <div className="text-2xl font-bold">{currentThingSpeakData?.humidity.toFixed(0)}%</div>
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
              <div className="text-2xl font-bold">{currentThingSpeakData?.pressure.toFixed(0)} hPa</div>
            </CardContent>
          </Card>
        </div>

        {/* Deuxième carte avec graphique multi-séries (LineChart) */}
        <Card>
          <CardHeader>
            <CardTitle>Évolution des données météorologiques</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="w-full h-96">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={historicalData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="timestamp.seconds"
                    tickFormatter={(timestamp) => new Date(timestamp * 1000).toLocaleTimeString()}
                  />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="temperature"
                    stroke="#ef4444"
                    name="Température (°C)"
                  />
                  <Line
                    type="monotone"
                    dataKey="humidity"
                    stroke="#3b82f6"
                    name="Humidité (%)"
                  />
                  <Line
                    type="monotone"
                    dataKey="pressure"
                    stroke="#8b5cf6"
                    name="Pression (hPa)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Onglets pour les graphiques historiques (AreaChart) */}
        <Tabs defaultValue="temperature" className="w-full">
          <TabsList className="grid grid-cols-3 md:grid-cols-3">
            <TabsTrigger value="temperature">Température</TabsTrigger>
            <TabsTrigger value="humidity">Humidité</TabsTrigger>
            <TabsTrigger value="pressure">Pression</TabsTrigger>
          </TabsList>

          <TabsContent value="temperature">
            <Card>
              <CardHeader>
                <CardTitle>Évolution de la température</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="w-full h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={historicalData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="timestamp.seconds"
                        tickFormatter={(timestamp) => new Date(timestamp * 1000).toLocaleTimeString()}
                      />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="temperature"
                        stroke="#ef4444"
                        fill="#ef4444"
                        fillOpacity={0.3}
                        name="Température (°C)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="humidity">
            <Card>
              <CardHeader>
                <CardTitle>Évolution de l'humidité</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="w-full h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={historicalData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="timestamp.seconds"
                        tickFormatter={(timestamp) => new Date(timestamp * 1000).toLocaleTimeString()}
                      />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="humidity"
                        stroke="#3b82f6"
                        fill="#3b82f6"
                        fillOpacity={0.3}
                        name="Humidité (%)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pressure">
            <Card>
              <CardHeader>
                <CardTitle>Évolution de la pression</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="w-full h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={historicalData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="timestamp.seconds"
                        tickFormatter={(timestamp) => new Date(timestamp * 1000).toLocaleTimeString()}
                      />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="pressure"
                        stroke="#8b5cf6"
                        fill="#8b5cf6"
                        fillOpacity={0.3}
                        name="Pression (hPa)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}