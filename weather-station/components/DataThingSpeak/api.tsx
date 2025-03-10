import axios from "axios";
import { db } from "@/lib/firebase";
import { collection, addDoc } from "firebase/firestore";

const CHANNEL_ID = "2869518"; // Remplacez par votre ID de canal
const READ_API_KEY = "MZYCBLKPZ1IP9YHR"; // Remplacez par votre clé API
const THINGSPEAK_API_URL = `https://api.thingspeak.com/channels/${CHANNEL_ID}/feeds.json?api_key=${READ_API_KEY}&results=10`;

async function fetchAndSaveData() {
  try {
    const response = await axios.get(THINGSPEAK_API_URL);
    console.log(response.data);

    if (!response.data || !response.data.feeds) {
      throw new Error("Aucune donnée trouvée dans la réponse de ThingSpeak");
    }

    const feeds = response.data.feeds;

    if (feeds.length > 0) {
      const latestData = feeds[0];

      if (!latestData.field1 || !latestData.field2 || !latestData.created_at) {
        throw new Error("Données manquantes dans le dernier enregistrement");
      }

      const sensorDataRef = collection(db, "sensorData");
      await addDoc(sensorDataRef, {
        temperature: parseFloat(latestData.field1),
        humidity: parseFloat(latestData.field2),
        timestamp: new Date(latestData.created_at),
      });

      console.log("✅ Données enregistrées avec succès !");
    } else {
      console.log("Aucune donnée disponible dans le canal ThingSpeak");
    }
  } catch (error) {
    console.error("❌ Erreur lors de la récupération ou l'enregistrement des données :", error.message);
  }
}

// Exécuter toutes les 5 minutes (si sur un serveur Node.js)
setInterval(fetchAndSaveData, 5 * 60 * 1000);