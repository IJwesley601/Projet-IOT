const axios = require("axios");
const admin = require("firebase-admin");

// Initialiser Firebase Admin SDK
const serviceAccount = require("./path/to/serviceAccountKey.json"); // Téléchargez ce fichier depuis Firebase Console
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore(); // Utiliser Firestore

// Configuration ThingSpeak
const CHANNEL_ID = "2869518"; // Remplacez par votre ID de canal
const READ_API_KEY = "MZYCBLKPZ1IP9YHR"; // Remplacez par votre clé API
const THINGSPEAK_API_URL = `https://api.thingspeak.com/channels/${CHANNEL_ID}/feeds.json?api_key=${READ_API_KEY}&results=10`;

// Fonction pour récupérer les données de ThingSpeak et les envoyer vers Firestore
async function fetchAndSaveData() {
  try {
    // Récupérer les données de ThingSpeak
    const response = await axios.get(THINGSPEAK_API_URL);
    console.log("Réponse de ThingSpeak :", response.data);

    if (!response.data || !response.data.feeds) {
      throw new Error("Aucune donnée trouvée dans la réponse de ThingSpeak");
    }

    const feeds = response.data.feeds;

    if (feeds.length > 0) {
      const latestData = feeds[0]; // Prendre la dernière entrée

      if (!latestData.field1 || !latestData.field2 || !latestData.created_at) {
        throw new Error("Données manquantes dans le dernier enregistrement");
      }

      // Préparer les données pour Firestore
      const sensorData = {
        temperature: parseFloat(latestData.field1),
        humidity: parseFloat(latestData.field2),
        timestamp: new Date(latestData.created_at),
      };

      // Ajouter les données à Firestore
      const sensorDataRef = db.collection("sensorData");
      await sensorDataRef.add(sensorData);

      console.log("✅ Données enregistrées avec succès dans Firestore !");
    } else {
      console.log("Aucune donnée disponible dans le canal ThingSpeak");
    }
  } catch (error) {
    console.error("❌ Erreur lors de la récupération ou l'enregistrement des données :", error.message);
  }
}

// Exécuter la fonction toutes les 5 minutes
setInterval(fetchAndSaveData, 5 * 60 * 1000);

// Exécuter immédiatement au démarrage
fetchAndSaveData();