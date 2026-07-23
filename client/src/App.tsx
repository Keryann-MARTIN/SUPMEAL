import { useEffect, useState } from "react"
import "./App.css"

function App() {
  const [message, setMessage] = useState("Connexion à l'API...")

  useEffect(() => {
    fetch("http://localhost:3000")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Erreur API")
        }

        return response.json()
      })
      .then((data: { message: string }) => {
        setMessage(data.message)
      })
      .catch(() => {
        setMessage("Impossible de contacter l'API")
      })
  }, [])

  return (
    <main className="container">
      <h1>SUPMEAL</h1>
      <p>{message}</p>
    </main>
  )
}

export default App