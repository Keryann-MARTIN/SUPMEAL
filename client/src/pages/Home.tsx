import { useEffect, useState } from "react"
import type { SyntheticEvent } from "react"
import { Link, useNavigate } from "react-router-dom"
import socket from "../socket"

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

type Member = {
    id: number
    role: string
    user: {
        id: number
        name: string
        email: string
    }
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

    const [selectedCookbook, setSelectedCookbook] = useState<Cookbook | null>(null)
    const [members, setMembers] = useState<Member[]>([])
    const [memberEmail, setMemberEmail] = useState("")
    const [memberRole, setMemberRole] = useState("READER")
    const [memberMessage, setMemberMessage] = useState("")

    useEffect(() => {
        function handleConnect() {
            console.log("Socket.IO connecté", socket.id)
        }

        socket.on("connect", handleConnect)

        return () => {
            socket.off("connect", handleConnect)
        }
    }, [])

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

        setCookbooks(await fetchCookbooks(token))
        setName("")
        setDescription("")
    }

    async function loadMembers(cookbook: Cookbook) {
        const token = localStorage.getItem("token")

        if (!token) {
            navigate("/login")
            return
        }

        setMemberMessage("")

        const response = await fetch(
            `http://localhost:3000/cookbooks/${cookbook.id}/members`,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        )

        const data = await response.json()

        if (!response.ok) {
            setMemberMessage(data.message)
            return
        }

        setSelectedCookbook(cookbook)
        setMembers(data)
    }

    async function addMember(event: SyntheticEvent<HTMLFormElement>) {
        event.preventDefault()

        if (!selectedCookbook) {
            return
        }

        const token = localStorage.getItem("token")

        if (!token) {
            navigate("/login")
            return
        }

        setMemberMessage("")

        const response = await fetch(
            `http://localhost:3000/cookbooks/${selectedCookbook.id}/members`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    email: memberEmail,
                    role: memberRole
                })
            }
        )

        const data = await response.json()

        if (!response.ok) {
            setMemberMessage(data.message)
            return
        }

        setMemberEmail("")
        setMemberRole("READER")

        await loadMembers(selectedCookbook)
    }

    async function changeRole(memberId: number, role: string) {
        if (!selectedCookbook) {
            return
        }

        const token = localStorage.getItem("token")

        if (!token) {
            navigate("/login")
            return
        }

        const response = await fetch(
            `http://localhost:3000/cookbooks/${selectedCookbook.id}/members/${memberId}`,
            {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    role
                })
            }
        )

        const data = await response.json()

        if (!response.ok) {
            setMemberMessage(data.message)
            return
        }

        await loadMembers(selectedCookbook)
    }

    async function removeMember(memberId: number) {
        if (!selectedCookbook) {
            return
        }

        if (!window.confirm("Supprimer ce membre du cookbook ?")) {
            return
        }

        const token = localStorage.getItem("token")

        if (!token) {
            navigate("/login")
            return
        }

        const response = await fetch(
            `http://localhost:3000/cookbooks/${selectedCookbook.id}/members/${memberId}`,
            {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        )

        const data = await response.json()

        if (!response.ok) {
            setMemberMessage(data.message)
            return
        }

        await loadMembers(selectedCookbook)
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

                <div className="header-actions">
                    <Link className="button-link" to="/recipes">
                        Recettes
                    </Link>

                    <button onClick={logout}>Se déconnecter</button>
                </div>
            </header>

            <div className="dashboard">
                <section className="panel">
                    <h2>Créer un cookbook</h2>

                    <form className="cookbook-form" onSubmit={handleSubmit}>
                        <label htmlFor="cookbook-name">Nom</label>
                        <input
                            id="cookbook-name"
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

                                    {cookbook.description && <p>{cookbook.description}</p>}

                                    <div className="cookbook-footer">
                                        <span>{cookbook.role}</span>

                                        <button
                                            type="button"
                                            onClick={() => loadMembers(cookbook)}
                                        >
                                            Membres
                                        </button>
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                </section>
            </div>

            {selectedCookbook && (
                <section className="members-panel">
                    <div className="members-header">
                        <h2>Membres de {selectedCookbook.name}</h2>

                        <button
                            type="button"
                            className="secondary-button"
                            onClick={() => setSelectedCookbook(null)}
                        >
                            Fermer
                        </button>
                    </div>

                    {selectedCookbook.role === "OWNER" && (
                        <form className="member-form" onSubmit={addMember}>
                            <div>
                                <label htmlFor="member-email">Email</label>
                                <input
                                    id="member-email"
                                    type="email"
                                    value={memberEmail}
                                    onChange={(event) => setMemberEmail(event.target.value)}
                                    required
                                />
                            </div>

                            <div>
                                <label htmlFor="member-role">Rôle</label>
                                <select
                                    id="member-role"
                                    value={memberRole}
                                    onChange={(event) => setMemberRole(event.target.value)}
                                >
                                    <option value="EDITOR">Éditeur</option>
                                    <option value="READER">Lecteur</option>
                                    <option value="COMMENTATOR">Commentateur</option>
                                </select>
                            </div>

                            <button type="submit">Ajouter</button>
                        </form>
                    )}

                    {memberMessage && (
                        <p className="error-message">{memberMessage}</p>
                    )}

                    <div className="member-list">
                        {members.map((member) => (
                            <article className="member-card" key={member.id}>
                                <div>
                                    <strong>{member.user.name}</strong>
                                    <p>{member.user.email}</p>
                                </div>

                                {selectedCookbook.role === "OWNER" &&
                                    member.role !== "OWNER" ? (
                                    <div className="member-actions">
                                        <select
                                            value={member.role}
                                            onChange={(event) =>
                                                changeRole(member.id, event.target.value)
                                            }
                                        >
                                            <option value="EDITOR">Éditeur</option>
                                            <option value="READER">Lecteur</option>
                                            <option value="COMMENTATOR">Commentateur</option>
                                        </select>

                                        <button
                                            type="button"
                                            className="delete-button"
                                            onClick={() => removeMember(member.id)}
                                        >
                                            Supprimer
                                        </button>
                                    </div>
                                ) : (
                                    <span className="member-role">{member.role}</span>
                                )}
                            </article>
                        ))}
                    </div>
                </section>
            )}
        </main>
    )
}

export default Home