"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertCircle,
  CloudRain,
  CloudLightning,
  Wind,
  Thermometer,
  Droplets,
  Gauge,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { toast } from "@/hooks/use-toast";
import * as tf from "@tensorflow/tfjs"; // Import TensorFlow.js

interface WeatherPredictionsProps {
  channelId: string;
  readApiKey: string;
}

export default function WeatherPredictions({
  channelId,
  readApiKey,
}: WeatherPredictionsProps) {
  const [weatherData, setWeatherData] = useState<Record<string, number>>({});
  const [historicalData, setHistoricalData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<"today" | "tomorrow" | string>(
    "today"
  );

  const calculateWindSpeed = (
    temperature: number,
    humidity: number,
    pressure: number
  ) => {
    // Vérifier si la pression est valide
    if (isNaN(pressure) || pressure === 0) {
      console.error(
        "Pression invalide pour le calcul de la vitesse du vent :",
        { temperature, humidity, pressure }
      );
      return 0; // Retourner une valeur par défaut
    }

    // Constantes pour ajuster la formule
    const BASE_PRESSURE = 1013.25; // Pression atmosphérique standard (hPa)
    const TEMP_FACTOR = 0.1; // Influence de la température sur le vent
    const HUMIDITY_FACTOR = 0.05; // Influence de l'humidité sur le vent
    const PRESSURE_FACTOR = 2.5; // Influence de la différence de pression sur le vent

    // Calculer la différence de pression par rapport à la pression standard
    const pressureDifference = Math.abs(BASE_PRESSURE - pressure);

    // Calculer la vitesse du vent en fonction des paramètres
    const windSpeed =
      TEMP_FACTOR * temperature + // Influence de la température
      HUMIDITY_FACTOR * humidity + // Influence de l'humidité
      PRESSURE_FACTOR * pressureDifference; // Influence de la différence de pression

    // Limiter la vitesse du vent à des valeurs réalistes
    const maxWindSpeed = 300; // Vitesse maximale réaliste (en km/h) pour un cyclone
    const minWindSpeed = 0; // Vitesse minimale

    // Retourner la vitesse du vent, arrondie à une décimale
    return Math.max(
      minWindSpeed,
      Math.min(maxWindSpeed, Math.round(windSpeed * 10) / 10)
    );
  };

  const calculateRainfall = (
    humidity: number,
    temperature: number,
    windSpeed: number
  ) => {
    if (isNaN(humidity) || isNaN(temperature) || isNaN(windSpeed)) {
      console.error("Invalid input for rainfall calculation:", {
        humidity,
        temperature,
        windSpeed,
      });
      return 0; // Retourner une valeur par défaut
    }

    const rainfall = (humidity / 100) * (temperature / 30) * (windSpeed / 10);
    return Math.round(rainfall * 10) / 10;
  };

  const fetchDataFromThingSpeak = async () => {
    const url = `https://api.thingspeak.com/channels/2869518/feeds.json?api_key=OC2L6MY2LT55QSCA&results=168`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      if (data.feeds && data.feeds.length > 0) {
        const latestData = data.feeds[data.feeds.length - 1];
        const temperature = parseFloat(latestData.field1);
        const humidity = parseFloat(latestData.field2);
        const pressure = parseFloat(latestData.field3);

        // Vérifier si les données sont valides
        if (isNaN(temperature) || isNaN(humidity) || isNaN(pressure)) {
          console.error("Données invalides reçues de ThingSpeak :", {
            temperature,
            humidity,
            pressure,
          });
          return; // Ne pas mettre à jour les données si elles sont invalides
        }

        const windSpeed =
          pressure > 0
            ? calculateWindSpeed(temperature, humidity, pressure)
            : 0;
        const rainfall = calculateRainfall(humidity, temperature, windSpeed);

        setWeatherData({
          temperature,
          humidity,
          pressure,
          windSpeed,
          rainfall,
          windDirection: parseFloat(latestData.field6),
        });

        const formattedData = data.feeds.map((feed: any) => ({
          date: new Date(feed.created_at),
          hour: new Date(feed.created_at).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          temperature: parseFloat(feed.field1),
          humidity: parseFloat(feed.field2),
          pressure: parseFloat(feed.field3),
          windSpeed: calculateWindSpeed(temperature, humidity, pressure),
          rainfall: calculateRainfall(humidity, temperature, windSpeed),
        }));
        setHistoricalData(formattedData);
      }
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des données de ThingSpeak :",
        error
      );
      toast({
        title: "Erreur",
        description: "Impossible de récupérer les données météo.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDataFromThingSpeak();
    const interval = setInterval(fetchDataFromThingSpeak, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (weatherData.temperature > 35) {
      toast({
        title: "Alerte Canicule",
        description: `Température élevée: ${weatherData.temperature}°C`,
        variant: "destructive",
      });
    }
    if (weatherData.rainfall > 5) {
      toast({
        title: "Alerte Forte Pluie",
        description: `Précipitations élevées: ${weatherData.rainfall} mm`,
        variant: "destructive",
      });
    }
    if (weatherData.windSpeed > 30) {
      toast({
        title: "Alerte Tempête",
        description: `Vent fort: ${weatherData.windSpeed} km/h`,
        variant: "destructive",
      });
    }
  }, [weatherData]);

  const calculateStd = (tensor: tf.Tensor) => {
    const mean = tensor.mean(); // Calculer la moyenne
    const squaredDiff = tensor.sub(mean).square(); // (x - mean)^2
    const variance = squaredDiff.mean(); // Moyenne des carrés des différences
    const std = variance.sqrt(); // Racine carrée de la variance
    return std;
  };

  const trainLinearModel = (data: number[]) => {
    const X = tf.range(0, data.length).arraySync();
    const Y = data;

    // Normaliser les données
    const X_tensor = tf.tensor1d(X);
    const Y_tensor = tf.tensor1d(Y);

    const X_mean = X_tensor.mean();
    const X_std = calculateStd(X_tensor);
    const Y_mean = Y_tensor.mean();
    const Y_std = calculateStd(Y_tensor);

    const X_normalized = X_tensor.sub(X_mean).div(X_std);
    const Y_normalized = Y_tensor.sub(Y_mean).div(Y_std);

    // Entraîner le modèle
    const a = tf.variable(tf.scalar(Math.random()));
    const b = tf.variable(tf.scalar(Math.random()));

    const predict = (X: tf.Tensor) => a.mul(X).add(b);
    const loss = (pred: tf.Tensor, Y: tf.Tensor) => pred.sub(Y).square().mean();

    const learningRate = 0.01;
    const optimizer = tf.train.sgd(learningRate);

    for (let i = 0; i < 100; i++) {
      optimizer.minimize(() => loss(predict(X_normalized), Y_normalized));
    }

    return { a, b, X_mean, X_std, Y_mean, Y_std };
  };

  const predictFutureData = (data: any[], daysToPredict: number) => {
    const predictedData = [];
    const lastDataPoint = data[data.length - 1];
    const date = new Date(lastDataPoint.date);

    // Extraire les données historiques pour chaque variable
    const temperatures = data.map((d) => d.temperature);
    const humidities = data.map((d) => d.humidity);
    const pressures = data.map((d) => d.pressure);

    // Entraîner les modèles
    const tempModel = trainLinearModel(temperatures);
    const humidityModel = trainLinearModel(humidities);
    const pressureModel = trainLinearModel(pressures);

    for (let day = 1; day <= daysToPredict; day++) {
      for (let hour = 0; hour < 24; hour++) {
        const newDate = new Date(date);
        newDate.setDate(date.getDate() + day);
        newDate.setHours(hour, 0, 0, 0);

        // Prédire les valeurs
        const futureIndex = data.length + (day - 1) * 24 + hour;
        const X_normalized = tf
          .scalar(futureIndex)
          .sub(tempModel.X_mean)
          .div(tempModel.X_std);

        // Prédire la température
        let temperature = tempModel.a
          .mul(X_normalized)
          .add(tempModel.b)
          .mul(tempModel.Y_std)
          .add(tempModel.Y_mean)
          .dataSync()[0];

        // Prédire l'humidité et la contraindre entre 0% et 100%
        let humidity = humidityModel.a
          .mul(X_normalized)
          .add(humidityModel.b)
          .mul(humidityModel.Y_std)
          .add(humidityModel.Y_mean)
          .dataSync()[0];
        humidity = Math.max(0, Math.min(100, humidity)); // Contraindre entre 0% et 100%

        // Prédire la pression et s'assurer qu'elle est positive
        let pressure = pressureModel.a
          .mul(X_normalized)
          .add(pressureModel.b)
          .mul(pressureModel.Y_std)
          .add(pressureModel.Y_mean)
          .dataSync()[0];
        pressure = Math.max(0, pressure); // Contraindre à une valeur positive

        // Calculer la vitesse du vent et s'assurer qu'elle n'est pas négative
        let windSpeed = calculateWindSpeed(temperature, humidity, pressure);
        windSpeed = Math.max(0, windSpeed); // Contraindre à une valeur positive

        // Calculer les précipitations
        const rainfall = calculateRainfall(humidity, temperature, windSpeed);

        // Vérifier les valeurs NaN
        if (
          isNaN(temperature) ||
          isNaN(humidity) ||
          isNaN(pressure) ||
          isNaN(windSpeed) ||
          isNaN(rainfall)
        ) {
          console.error("NaN detected in predictions:", {
            temperature,
            humidity,
            pressure,
            windSpeed,
            rainfall,
          });
          continue; // Ignorer cette itération
        }

        // Ajouter les données prédites
        predictedData.push({
          date: newDate,
          hour: newDate.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          temperature,
          humidity,
          pressure,
          windSpeed,
          rainfall,
        });
      }
    }
    return predictedData;
  };

  const detectThreat = (data: any[]) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    // Analyser les données pour les 2 prochains jours
    const futureData = data.filter((entry) => {
      const entryDate = new Date(entry.date);
      return (
        entryDate >= today &&
        entryDate <= new Date(today.setDate(today.getDate() + 2))
      );
    });

    // Détecter les menaces
    let threat = {
      type: "none",
      message: "Aucune menace détectée prochainement",
      severity: "low",
    };

    futureData.forEach((entry) => {
      if (entry.temperature > 35) {
        threat = {
          type: "heatwave",
          message: `Alerte Canicule: Température élevée (${
            entry.temperature
          }°C) prévue le ${new Date(entry.date).toLocaleDateString("fr-FR")}`,
          severity: "high",
        };
      }
      if (entry.rainfall > 5) {
        threat = {
          type: "heavyRain",
          message: `Alerte Forte Pluie: Précipitations élevées (${
            entry.rainfall
          } mm) prévues le ${new Date(entry.date).toLocaleDateString("fr-FR")}`,
          severity: "high",
        };
      }
      if (entry.windSpeed > 30) {
        threat = {
          type: "storm",
          message: `Alerte Tempête: Vent fort (${
            entry.windSpeed
          } km/h) prévu le ${new Date(entry.date).toLocaleDateString("fr-FR")}`,
          severity: "high",
        };
      }
    });

    return threat;
  };

  const filterDataByDay = (data: any[], day: "today" | "tomorrow" | string) => {
    const today = new Date();
    const targetDate = new Date(today);

    if (day === "tomorrow") {
      targetDate.setDate(today.getDate() + 1);
    } else if (day !== "today") {
      const dayOffset = parseInt(day.split("-")[1], 10);
      targetDate.setDate(today.getDate() + dayOffset);
    }

    return data.filter((entry) => {
      const entryDate = new Date(entry.date);
      return (
        entryDate.getDate() === targetDate.getDate() &&
        entryDate.getMonth() === targetDate.getMonth() &&
        entryDate.getFullYear() === targetDate.getFullYear()
      );
    });
  };

  const dayOptions = [
    { value: "today", label: "Aujourd'hui" },
    { value: "tomorrow", label: "Demain" },
    ...Array.from({ length: 6 }, (_, i) => ({
      value: `day-${i + 2}`,
      label: new Date(
        new Date().setDate(new Date().getDate() + i + 2)
      ).toLocaleDateString("fr-FR", {
        weekday: "long",
      }),
    })),
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  const predictedData = predictFutureData(historicalData, 6);
  const combinedData = [...historicalData, ...predictedData];
  const threat = detectThreat(combinedData);

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
            <span>
              Température:{" "}
              {isNaN(weatherData.temperature) ? "N/A" : weatherData.temperature}
              °C
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Droplets className="h-5 w-5 text-blue-500" />
            <span>
              Humidité:{" "}
              {isNaN(weatherData.humidity) ? "N/A" : weatherData.humidity}%
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Gauge className="h-5 w-5 text-purple-500" />
            <span>
              Pression:{" "}
              {isNaN(weatherData.pressure) ? "N/A" : weatherData.pressure} hPa
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Wind className="h-5 w-5 text-cyan-500" />
            <span>
              Vent:{" "}
              {isNaN(weatherData.windSpeed) ? "N/A" : weatherData.windSpeed}{" "}
              km/h
            </span>
          </div>
          <div className="flex items-center gap-2">
            <CloudRain className="h-5 w-5 text-blue-600" />
            <span>
              Pluie:{" "}
              {isNaN(weatherData.rainfall) ? "N/A" : weatherData.rainfall} mm
            </span>
          </div>
          <div
            className={`px-4 py-3 text-sm rounded-lg mx-2 mb-4 ${
              threat.severity === "high"
                ? "bg-red-600 text-white"
                : "bg-green-600 text-white"
            }`}
          >
            <div className="flex items-center gap-2">
              {threat.severity === "high" ? (
                <AlertTriangle />
              ) : (
                <CheckCircle className="h-5 w-5" />
              )}
              <span>
                {threat.severity === "high" ? "Menace" : "Aucune menace"}
              </span>
            </div>
            <p>{threat.message}</p>
          </div>
        </div>

        <div className="flex gap-2">
          <select
            value={selectedDay}
            onChange={(e) => setSelectedDay(e.target.value)}
            className="px-4 py-2 rounded bg-gray-200"
          >
            {dayOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-4">
          <h3 className="text-lg font-semibold mb-2">
            Prévisions pour{" "}
            {dayOptions.find((option) => option.value === selectedDay)?.label}
          </h3>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={filterDataByDay(combinedData, selectedDay)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" />
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
                dataKey="windSpeed"
                stroke="#10b981"
                name="Vitesse du vent (km/h)"
              />
              <Line
                type="monotone"
                dataKey="rainfall"
                stroke="#6366f1"
                name="Précipitations (mm)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
