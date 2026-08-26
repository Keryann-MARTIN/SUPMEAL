import { useCallback, useEffect, useState } from "react"
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

type CookbookMessage = {
    id: number
    content: string
    createdAt: string
    user: {
        id: number
        name: string
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

    const [selectedChatCookbook, setSelectedChatCookbook] = useState<Cookbook | null>(null)

    const [chatMessages, setChatMessages] = useState<CookbookMessage[]>([])
    const [newMessage, setNewMessage] = useState("")
    const [chatError, setChatError] = useState("")

    const [importFile, setImportFile] = useState<File | null>(null)
    const [importMessage, setImportMessage] = useState("")
    const [importSuccess, setImportSuccess] = useState(false)

    const loadChatMessages = useCallback(
        async (cookbookId: number) => {
            const token = localStorage.getItem("token")

            if (!token) {
                navigate("/login")
                return
            }

            try {
                const response = await fetch(
                    `http://localhost:3000/cookbooks/${cookbookId}/messages`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                )

                const data = await response.json()

                if (!response.ok) {
                    setChatError(data.message)
                    return
                }

                setChatMessages(data)
            } catch {
                setChatError("Impossible de récupérer les messages")
            }
        },
        [navigate]
    )

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

    useEffect(() => {
        if (!selectedChatCookbook) {
            return
        }

        function handleMessagesUpdated(data: { cookbookId: number }) {
            if (data.cookbookId === selectedChatCookbook?.id) {
                loadChatMessages(data.cookbookId)
            }
        }

        socket.on("cookbook-messages-updated", handleMessagesUpdated)

        return () => {
            socket.off("cookbook-messages-updated", handleMessagesUpdated)
        }
    }, [selectedChatCookbook, loadChatMessages])

    async function openChat(cookbook: Cookbook) {
        setSelectedCookbook(null)
        setSelectedChatCookbook(cookbook)
        setChatMessages([])
        setNewMessage("")
        setChatError("")

        await loadChatMessages(cookbook.id)
    }

    async function sendMessage(event: SyntheticEvent<HTMLFormElement>) {
        event.preventDefault()

        if (!selectedChatCookbook) {
            return
        }

        const token = localStorage.getItem("token")

        if (!token) {
            navigate("/login")
            return
        }

        setChatError("")

        const response = await fetch(
            `http://localhost:3000/cookbooks/${selectedChatCookbook.id}/messages`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    content: newMessage
                })
            }
        )

        const data = await response.json()

        if (!response.ok) {
            setChatError(data.message)
            return
        }

        setNewMessage("")

        await loadChatMessages(selectedChatCookbook.id)
    }

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

        setSelectedChatCookbook(null)

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

    async function exportData() {
        const confirmed = window.confirm(
            "L'export contient vos recettes et cookbooks en clair. Continuer ?"
        )

        if (!confirmed) {
            return
        }

        const token = localStorage.getItem("token")

        if (!token) {
            navigate("/login")
            return
        }

        const response = await fetch("http://localhost:3000/export", {
            headers: {
                Authorization: `Bearer ${token}`
            }
        })

        if (!response.ok) {
            setMessage("Impossible d'exporter les données")
            return
        }

        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)

        const link = document.createElement("a")
        link.href = url
        link.download = "supmeal-export.json"
        link.click()

        window.URL.revokeObjectURL(url)
    }

    async function importData(event: SyntheticEvent<HTMLFormElement>) {
        event.preventDefault()

        if (!importFile) {
            setImportMessage("Sélectionnez un fichier JSON")
            setImportSuccess(false)
            return
        }

        const token = localStorage.getItem("token")

        if (!token) {
            navigate("/login")
            return
        }

        const form = event.currentTarget
        const formData = new FormData()

        formData.append("file", importFile)

        try {
            const response = await fetch("http://localhost:3000/import", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`
                },
                body: formData
            })

            const data = await response.json()

            if (!response.ok) {
                setImportMessage(data.message)
                setImportSuccess(false)
                return
            }

            setImportMessage(
                `Import terminé : ${data.personalRecipes} recette(s) personnelle(s), ${data.cookbooks} cookbook(s) et ${data.cookbookRecipes} recette(s) de cookbook.`
            )

            setImportSuccess(true)
            setImportFile(null)
            form.reset()

            setCookbooks(await fetchCookbooks(token))
        } catch {
            setImportMessage("Impossible d'importer le fichier")
            setImportSuccess(false)
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

                <div className="header-actions">
                    <Link className="button-link" to="/recipes">
                        Recettes
                    </Link>

                    <button
                        type="button"
                        className="secondary-button"
                        onClick={exportData}
                    >
                        Exporter
                    </button>

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

                                        <div className="cookbook-buttons">
                                            <Link
                                                className="button-link"
                                                to={`/cookbooks/${cookbook.id}`}
                                            >
                                                Ouvrir
                                            </Link>

                                            <button
                                                type="button"
                                                onClick={() => loadMembers(cookbook)}
                                            >
                                                Membres
                                            </button>

                                            <button
                                                type="button"
                                                className="secondary-button"
                                                onClick={() => openChat(cookbook)}
                                            >
                                                Discussion
                                            </button>
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                </section>
            </div>

            <section className="import-panel">
                <h2>Importer des données</h2>

                <p>
                    Importer un fichier JSON précédemment exporté depuis SUPMEAL.
                </p>

                <form className="import-form" onSubmit={importData}>
                    <label htmlFor="import-file">Fichier JSON</label>

                    <input
                        id="import-file"
                        type="file"
                        accept=".json,application/json"
                        onChange={(event) =>
                            setImportFile(event.target.files?.[0] || null)
                        }
                        required
                    />

                    <button type="submit">
                        Importer
                    </button>
                </form>

                {importMessage && (
                    <p
                        className={
                            importSuccess
                                ? "success-message"
                                : "error-message"
                        }
                    >
                        {importMessage}
                    </p>
                )}
            </section>

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
            {selectedChatCookbook && (
                <section className="chat-panel">
                    <div className="members-header">
                        <div>
                            <h2>Discussion - {selectedChatCookbook.name}</h2>
                            <p>Discussion entre les membres du cookbook</p>
                        </div>

                        <button
                            type="button"
                            className="secondary-button"
                            onClick={() => setSelectedChatCookbook(null)}
                        >
                            Fermer
                        </button>
                    </div>

                    <div className="chat-messages">
                        {chatMessages.length === 0 ? (
                            <p>Aucun message pour le moment.</p>
                        ) : (
                            chatMessages.map((message) => (
                                <div className="chat-message" key={message.id}>
                                    <div className="chat-message-header">
                                        <strong>{message.user.name}</strong>

                                        <span>
                                            {new Date(message.createdAt).toLocaleString("fr-FR")}
                                        </span>
                                    </div>

                                    <p>{message.content}</p>
                                </div>
                            ))
                        )}
                    </div>

                    <form className="chat-form" onSubmit={sendMessage}>
                        <label htmlFor="new-message">Message</label>

                        <textarea
                            id="new-message"
                            value={newMessage}
                            onChange={(event) => setNewMessage(event.target.value)}
                            rows={3}
                            placeholder="Écrire un message..."
                            required
                        />

                        <button type="submit">Envoyer</button>
                    </form>

                    {chatError && (
                        <p className="error-message">{chatError}</p>
                    )}
                </section>
            )}
        </main>
    )
}

export default Home