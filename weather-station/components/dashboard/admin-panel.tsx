"use client"

import { Label } from "@/components/ui/label"

import { useState, useEffect } from "react"
import { collection, query, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { AlertTriangle, Search, UserCog, Settings, Trash2, Edit, Save, X } from "lucide-react"
import { toast } from "@/hooks/use-toast"

type User = {
  id: string
  name: string
  email: string
  role: "user" | "admin"
  createdAt: { seconds: number }
}

type Alert = {
  id: string
  userId: string
  userName: string
  type: string
  value: number
  threshold: number
  timestamp: { seconds: number }
  acknowledged: boolean
}

export default function AdminPanel() {
  const [users, setUsers] = useState<User[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [editingUser, setEditingUser] = useState<string | null>(null)
  const [editedUserData, setEditedUserData] = useState<Partial<User>>({})

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        // Fetch users
        const usersQuery = query(collection(db, "users"))
        const usersSnapshot = await getDocs(usersQuery)
        const usersData = usersSnapshot.docs.map(
          (doc) =>
            ({
              id: doc.id,
              ...doc.data(),
            }) as User,
        )
        setUsers(usersData)

        // Fetch alerts
        const alertsQuery = query(collection(db, "alerts"))
        const alertsSnapshot = await getDocs(alertsQuery)
        const alertsData = alertsSnapshot.docs.map(
          (doc) =>
            ({
              id: doc.id,
              ...doc.data(),
            }) as Alert,
        )

        // If no alerts, generate mock data
        if (alertsData.length === 0 && usersData.length > 0) {
          const mockAlerts = generateMockAlerts(usersData)
          setAlerts(mockAlerts)
        } else {
          setAlerts(alertsData)
        }
      } catch (error) {
        console.error("Error fetching admin data:", error)
        toast({
          title: "Erreur",
          description: "Impossible de charger les données administratives.",
          variant: "destructive",
        })

        // Generate mock data for demo purposes
        if (users.length === 0) {
          const mockUsers = generateMockUsers()
          setUsers(mockUsers)
          const mockAlerts = generateMockAlerts(mockUsers)
          setAlerts(mockAlerts)
        }
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleEditUser = (user: User) => {
    setEditingUser(user.id)
    setEditedUserData({
      name: user.name,
      email: user.email,
      role: user.role,
    })
  }

  const handleSaveUser = async (userId: string) => {
    try {
      // In a real app, update the user in Firestore
      // await updateDoc(doc(db, "users", userId), editedUserData);

      // Update local state
      setUsers(users.map((user) => (user.id === userId ? { ...user, ...editedUserData } : user)))

      toast({
        title: "Utilisateur mis à jour",
        description: "Les informations de l'utilisateur ont été mises à jour avec succès.",
      })
    } catch (error) {
      console.error("Error updating user:", error)
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour l'utilisateur.",
        variant: "destructive",
      })
    } finally {
      setEditingUser(null)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cet utilisateur ?")) {
      return
    }

    try {
      // In a real app, delete the user from Firestore
      // await deleteDoc(doc(db, "users", userId));

      // Update local state
      setUsers(users.filter((user) => user.id !== userId))

      toast({
        title: "Utilisateur supprimé",
        description: "L'utilisateur a été supprimé avec succès.",
      })
    } catch (error) {
      console.error("Error deleting user:", error)
      toast({
        title: "Erreur",
        description: "Impossible de supprimer l'utilisateur.",
        variant: "destructive",
      })
    }
  }

  const handleAcknowledgeAlert = async (alertId: string) => {
    try {
      // In a real app, update the alert in Firestore
      // await updateDoc(doc(db, "alerts", alertId), { acknowledged: true });

      // Update local state
      setAlerts(alerts.map((alert) => (alert.id === alertId ? { ...alert, acknowledged: true } : alert)))

      toast({
        title: "Alerte reconnue",
        description: "L'alerte a été marquée comme reconnue.",
      })
    } catch (error) {
      console.error("Error acknowledging alert:", error)
      toast({
        title: "Erreur",
        description: "Impossible de reconnaître l'alerte.",
        variant: "destructive",
      })
    }
  }

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Panneau d'administration</h1>

      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users">Utilisateurs</TabsTrigger>
          <TabsTrigger value="alerts">Alertes</TabsTrigger>
          <TabsTrigger value="settings">Paramètres système</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <UserCog className="mr-2 h-5 w-5" />
                Gestion des utilisateurs
              </CardTitle>
              <CardDescription>Gérer les utilisateurs et leurs permissions</CardDescription>
              <div className="flex items-center mt-2">
                <Search className="mr-2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un utilisateur..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-sm"
                />
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nom</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Rôle</TableHead>
                      <TableHead>Date d'inscription</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center">
                          Aucun utilisateur trouvé
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            {editingUser === user.id ? (
                              <Input
                                value={editedUserData.name || ""}
                                onChange={(e) => setEditedUserData({ ...editedUserData, name: e.target.value })}
                              />
                            ) : (
                              user.name
                            )}
                          </TableCell>
                          <TableCell>
                            {editingUser === user.id ? (
                              <Input
                                value={editedUserData.email || ""}
                                onChange={(e) => setEditedUserData({ ...editedUserData, email: e.target.value })}
                              />
                            ) : (
                              user.email
                            )}
                          </TableCell>
                          <TableCell>
                            {editingUser === user.id ? (
                              <div className="flex items-center space-x-2">
                                <span>Admin</span>
                                <Switch
                                  checked={editedUserData.role === "admin"}
                                  onCheckedChange={(checked) =>
                                    setEditedUserData({
                                      ...editedUserData,
                                      role: checked ? "admin" : "user",
                                    })
                                  }
                                />
                              </div>
                            ) : user.role === "admin" ? (
                              "Administrateur"
                            ) : (
                              "Utilisateur"
                            )}
                          </TableCell>
                          <TableCell>{new Date(user.createdAt.seconds * 1000).toLocaleDateString()}</TableCell>
                          <TableCell className="text-right">
                            {editingUser === user.id ? (
                              <div className="flex justify-end space-x-2">
                                <Button variant="ghost" size="icon" onClick={() => setEditingUser(null)}>
                                  <X className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => handleSaveUser(user.id)}>
                                  <Save className="h-4 w-4" />
                                </Button>
                              </div>
                            ) : (
                              <div className="flex justify-end space-x-2">
                                <Button variant="ghost" size="icon" onClick={() => handleEditUser(user)}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => handleDeleteUser(user.id)}>
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertTriangle className="mr-2 h-5 w-5" />
                Historique des alertes
              </CardTitle>
              <CardDescription>Consulter et gérer les alertes déclenchées</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Utilisateur</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Valeur</TableHead>
                      <TableHead>Seuil</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {alerts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center">
                          Aucune alerte trouvée
                        </TableCell>
                      </TableRow>
                    ) : (
                      alerts.map((alert) => (
                        <TableRow key={alert.id}>
                          <TableCell>{new Date(alert.timestamp.seconds * 1000).toLocaleString()}</TableCell>
                          <TableCell>{alert.userName}</TableCell>
                          <TableCell>{getAlertTypeName(alert.type)}</TableCell>
                          <TableCell>
                            {alert.value.toFixed(1)} {getAlertTypeUnit(alert.type)}
                          </TableCell>
                          <TableCell>
                            {alert.threshold.toFixed(1)} {getAlertTypeUnit(alert.type)}
                          </TableCell>
                          <TableCell>
                            <span
                              className={`px-2 py-1 rounded-full text-xs ${
                                alert.acknowledged ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                              }`}
                            >
                              {alert.acknowledged ? "Reconnue" : "Non reconnue"}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            {!alert.acknowledged && (
                              <Button variant="outline" size="sm" onClick={() => handleAcknowledgeAlert(alert.id)}>
                                Reconnaître
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="mr-2 h-5 w-5" />
                Paramètres système
              </CardTitle>
              <CardDescription>Configurer les paramètres globaux du système</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Fréquence d'échantillonnage</h3>
                <div className="flex items-center space-x-4">
                  <Input type="number" defaultValue="5" className="w-20" />
                  <span>minutes</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Définit la fréquence à laquelle la station météo envoie des données
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-medium">Rétention des données</h3>
                <div className="flex items-center space-x-4">
                  <Input type="number" defaultValue="90" className="w-20" />
                  <span>jours</span>
                </div>
                <p className="text-sm text-muted-foreground">Durée de conservation des données historiques</p>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-medium">Notifications système</h3>
                <div className="flex items-center space-x-2">
                  <Switch id="system-notifications" defaultChecked />
                  <Label htmlFor="system-notifications">Activer les notifications système</Label>
                </div>
                <p className="text-sm text-muted-foreground">
                  Envoyer des notifications en cas de problème avec la station météo
                </p>
              </div>

              <div className="pt-4">
                <Button>Enregistrer les paramètres</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function getAlertTypeName(type: string): string {
  const types: Record<string, string> = {
    temperature: "Température",
    humidity: "Humidité",
    pressure: "Pression",
    windSpeed: "Vitesse du vent",
    rainfall: "Précipitations",
    light: "Luminosité",
  }

  return types[type] || type
}

function getAlertTypeUnit(type: string): string {
  const units: Record<string, string> = {
    temperature: "°C",
    humidity: "%",
    pressure: "hPa",
    windSpeed: "km/h",
    rainfall: "mm",
    light: "%",
  }

  return units[type] || ""
}

// Helper function to generate mock users for demo purposes
function generateMockUsers(): User[] {
  return [
    {
      id: "user1",
      name: "Admin User",
      email: "admin@example.com",
      role: "admin",
      createdAt: { seconds: (Date.now() - 30 * 24 * 60 * 60 * 1000) / 1000 },
    },
    {
      id: "user2",
      name: "John Doe",
      email: "john@example.com",
      role: "user",
      createdAt: { seconds: (Date.now() - 20 * 24 * 60 * 60 * 1000) / 1000 },
    },
    {
      id: "user3",
      name: "Jane Smith",
      email: "jane@example.com",
      role: "user",
      createdAt: { seconds: (Date.now() - 10 * 24 * 60 * 60 * 1000) / 1000 },
    },
  ]
}

// Helper function to generate mock alerts for demo purposes
function generateMockAlerts(users: User[]): Alert[] {
  const alertTypes = ["temperature", "humidity", "pressure", "windSpeed", "rainfall"]
  const alerts: Alert[] = []

  for (let i = 0; i < 10; i++) {
    const user = users[Math.floor(Math.random() * users.length)]
    const type = alertTypes[Math.floor(Math.random() * alertTypes.length)]
    const isHigh = Math.random() > 0.5

    let value, threshold
    switch (type) {
      case "temperature":
        threshold = isHigh ? 35 : 0
        value = isHigh ? 36 + Math.random() * 5 : -5 + Math.random() * 5
        break
      case "humidity":
        threshold = isHigh ? 80 : 20
        value = isHigh ? 85 + Math.random() * 15 : 10 + Math.random() * 9
        break
      case "pressure":
        threshold = isHigh ? 1030 : 990
        value = isHigh ? 1035 + Math.random() * 10 : 980 + Math.random() * 9
        break
      case "windSpeed":
        threshold = 50
        value = 55 + Math.random() * 20
        break
      case "rainfall":
        threshold = 10
        value = 15 + Math.random() * 10
        break
      default:
        threshold = 50
        value = 60
    }

    alerts.push({
      id: `alert${i}`,
      userId: user.id,
      userName: user.name,
      type,
      value,
      threshold,
      timestamp: {
        seconds: (Date.now() - Math.floor(Math.random() * 7) * 24 * 60 * 60 * 1000) / 1000,
      },
      acknowledged: Math.random() > 0.3,
    })
  }

  // Sort by timestamp (newest first)
  return alerts.sort((a, b) => b.timestamp.seconds - a.timestamp.seconds)
}

