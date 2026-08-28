import { useState } from "react"
import type { SyntheticEvent } from "react"
import { Link, useNavigate } from "react-router-dom"

function Login() {
    const navigate = useNavigate()
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [message, setMessage] = useState("")

    async function handleSubmit(event: SyntheticEvent<HTMLFormElement>) {
        event.preventDefault()
        setMessage("")

        const response = await fetch("http://localhost:3000/auth/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email,
                password
            })
        })

        const data = await response.json()

        if (!response.ok) {
            setMessage(data.message)
            return
        }

        localStorage.setItem("token", data.token)
        navigate("/")
    }

    return (
        <main className="auth-page">
            <form className="auth-form" onSubmit={handleSubmit}>
                <h1>Connexion</h1>

                <label htmlFor="email">Adresse email</label>
                <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                />

                <label htmlFor="password">Mot de passe</label>
                <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                />

                {message && (
                    <p className="error-message">
                        {message}
                    </p>
                )}

                <button type="submit">
                    Se connecter
                </button>

                <div className="oauth-section">
                    <p>ou</p>

                    <a
                        className="button-link github-button"
                        href="http://localhost:3000/auth/github"
                    >
                        Se connecter avec GitHub
                    </a>
                </div>

                <p>
                    Pas encore inscrit ?{" "}
                    <Link to="/register">
                        Créer un compte
                    </Link>
                </p>
            </form>
        </main>
    )
}

export default Login