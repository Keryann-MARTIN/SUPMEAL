import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"

type User = {
    id: number
    name: string
    email: string
}

function Home() {
    const navigate = useNavigate()
    const [user, setUser] = useState<User | null>(null)

    useEffect(() => {
        const token = localStorage.getItem("token")

        if (!token) {
            navigate("/login")
            return
        }

        fetch("http://localhost:3000/auth/me", {
            headers: {
                Authorization: `Bearer ${token}`
            }
        })
            .then((response) => {
                if (!response.ok) {
                    throw new Error()
                }

                return response.json()
            })
            .then((data: User) => {
                setUser(data)
            })
            .catch(() => {
                localStorage.removeItem("token")
                navigate("/login")
            })
    }, [navigate])

    function logout() {
        localStorage.removeItem("token")
        navigate("/login")
    }

    if (!user) {
        return <p className="loading">Chargement...</p>
    }

    return (
        <main className="home-page">
            <h1>SUPMEAL</h1>
            <p>Bienvenue {user.name}</p>
            <p>{user.email}</p>
            <button onClick={logout}>Se déconnecter</button>
        </main>
    )
}

export default Home