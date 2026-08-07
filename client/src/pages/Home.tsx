import { useEffect, useState } from "react"
import type { SyntheticEvent } from "react"
import { useNavigate } from "react-router-dom"

type User = {
    id: number
    name: string
    email: string
}

type Cookbook = {
    id: number
    name: string
    description: string | null
    role: string
    createdAt: string
}

async function fetchCookbooks(token: string) {
    const response = await fetch("http://localhost:3000/cookbooks", {
        headers: {
            Authorization: `Bearer ${token}`
        }
    })

    if (!response.ok) {
        throw new Error()
    }

    return response.json() as Promise<Cookbook[]>
}

function Home() {
    const navigate = useNavigate()

    const [user, setUser] = useState<User | null>(null)
    const [cookbooks, setCookbooks] = useState<Cookbook[]>([])
    const [name, setName] = useState("")
    const [description, setDescription] = useState("")
    const [message, setMessage] = useState("")

    useEffect(() => {
        const token = localStorage.getItem("token")

        if (!token) {
            navigate("/login")
            return
        }

        async function loadData(authToken: string) {
            try {
                const userResponse = await fetch("http://localhost:3000/auth/me", {
                    headers: {
                        Authorization: `Bearer ${authToken}`
                    }
                })

                if (!userResponse.ok) {
                    throw new Error()
                }

                const userData = await userResponse.json()
                const cookbookData = await fetchCookbooks(authToken)

                setUser(userData)
                setCookbooks(cookbookData)
            } catch {
                localStorage.removeItem("token")
                navigate("/login")
            }
        }

        loadData(token)
    }, [navigate])

    async function handleSubmit(event: SyntheticEvent<HTMLFormElement>) {
        event.preventDefault()
        setMessage("")

        const token = localStorage.getItem("token")

        if (!token) {
            navigate("/login")
            return
        }

        try {
            const response = await fetch("http://localhost:3000/cookbooks", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    name,
                    description
                })
            })

            const data = await response.json()

            if (!response.ok) {
                setMessage(data.message)
                return
            }

            const updatedCookbooks = await fetchCookbooks(token)

            setCookbooks(updatedCookbooks)
            setName("")
            setDescription("")
        } catch {
            setMessage("Impossible de créer le cookbook")
        }
    }

    function logout() {
        localStorage.removeItem("token")
        navigate("/login")
    }

    if (!user) {
        return <p className="loading">Chargement...</p>
    }

    return (
        <main className="home-page">
            <header className="home-header">
                <div>
                    <h1>SUPMEAL</h1>
                    <p>Bienvenue {user.name}</p>
                </div>

                <button onClick={logout}>Se déconnecter</button>
            </header>

            <div className="dashboard">
                <section className="panel">
                    <h2>Créer un cookbook</h2>

                    <form className="cookbook-form" onSubmit={handleSubmit}>
                        <label htmlFor="cookbook-name">Nom</label>
                        <input
                            id="cookbook-name"
                            type="text"
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                            required
                        />

                        <label htmlFor="cookbook-description">Description</label>
                        <textarea
                            id="cookbook-description"
                            value={description}
                            onChange={(event) => setDescription(event.target.value)}
                            rows={4}
                        />

                        {message && <p className="error-message">{message}</p>}

                        <button type="submit">Créer</button>
                    </form>
                </section>

                <section className="panel">
                    <h2>Mes cookbooks</h2>

                    {cookbooks.length === 0 ? (
                        <p>Aucun cookbook pour le moment.</p>
                    ) : (
                        <div className="cookbook-list">
                            {cookbooks.map((cookbook) => (
                                <article className="cookbook-card" key={cookbook.id}>
                                    <h3>{cookbook.name}</h3>

                                    {cookbook.description && (
                                        <p>{cookbook.description}</p>
                                    )}

                                    <span>{cookbook.role}</span>
                                </article>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </main>
    )
}

export default Home