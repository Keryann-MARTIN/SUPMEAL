import { useEffect } from "react"
import { useNavigate } from "react-router-dom"

function OAuthCallback() {
    const navigate = useNavigate()

    const params = new URLSearchParams(
        window.location.hash.substring(1)
    )

    const token = params.get("token")
    const error = params.get("error")

    useEffect(() => {
        if (!token) {
            return
        }

        localStorage.setItem("token", token)
        navigate("/", { replace: true })
    }, [token, navigate])

    let message = "Connexion avec GitHub..."

    if (error) {
        message = error
    } else if (!token) {
        message = "Connexion GitHub impossible"
    }

    return (
        <main className="auth-page">
            <div className="auth-card">
                <h1>SUPMEAL</h1>
                <p>{message}</p>
            </div>
        </main>
    )
}

export default OAuthCallback