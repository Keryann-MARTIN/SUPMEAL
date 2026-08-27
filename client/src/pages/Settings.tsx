import { useEffect, useState } from "react"
import type { SyntheticEvent } from "react"
import { Link, useNavigate } from "react-router-dom"

function Settings() {
    const navigate = useNavigate()

    const [currentPassword, setCurrentPassword] = useState("")
    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")

    const [diet, setDiet] = useState("")
    const [allergies, setAllergies] = useState("")
    const [favoriteCuisine, setFavoriteCuisine] = useState("")
    const [defaultServings, setDefaultServings] = useState("1")

    const [passwordMessage, setPasswordMessage] = useState("")
    const [passwordSuccess, setPasswordSuccess] = useState(false)

    const [preferencesMessage, setPreferencesMessage] = useState("")
    const [preferencesSuccess, setPreferencesSuccess] = useState(false)

    useEffect(() => {
        const token = localStorage.getItem("token")

        if (!token) {
            navigate("/login")
            return
        }

        async function loadSettings(authToken: string) {
            const response = await fetch("http://localhost:3000/auth/me", {
                headers: {
                    Authorization: `Bearer ${authToken}`
                }
            })

            if (!response.ok) {
                localStorage.removeItem("token")
                navigate("/login")
                return
            }

            const user = await response.json()

            setDiet(user.diet || "")
            setAllergies(user.allergies?.join(", ") || "")
            setFavoriteCuisine(user.favoriteCuisine || "")
            setDefaultServings(String(user.defaultServings || 1))
        }

        loadSettings(token)
    }, [navigate])

    async function changePassword(event: SyntheticEvent<HTMLFormElement>) {
        event.preventDefault()

        if (newPassword !== confirmPassword) {
            setPasswordMessage("Les nouveaux mots de passe ne correspondent pas")
            setPasswordSuccess(false)
            return
        }

        const token = localStorage.getItem("token")

        if (!token) {
            navigate("/login")
            return
        }

        const response = await fetch(
            "http://localhost:3000/auth/password",
            {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    currentPassword,
                    newPassword
                })
            }
        )

        const data = await response.json()

        if (!response.ok) {
            setPasswordMessage(data.message)
            setPasswordSuccess(false)
            return
        }

        setPasswordMessage(data.message)
        setPasswordSuccess(true)

        setCurrentPassword("")
        setNewPassword("")
        setConfirmPassword("")
    }

    async function savePreferences(event: SyntheticEvent<HTMLFormElement>) {
        event.preventDefault()

        const token = localStorage.getItem("token")

        if (!token) {
            navigate("/login")
            return
        }

        const allergyList = allergies
            .split(",")
            .map((allergy) => allergy.trim())
            .filter(Boolean)

        const response = await fetch(
            "http://localhost:3000/auth/preferences",
            {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    diet,
                    allergies: allergyList,
                    favoriteCuisine,
                    defaultServings: Number(defaultServings)
                })
            }
        )

        const data = await response.json()

        if (!response.ok) {
            setPreferencesMessage(data.message)
            setPreferencesSuccess(false)
            return
        }

        setPreferencesMessage(data.message)
        setPreferencesSuccess(true)
    }

    return (
        <main className="settings-page">
            <header className="page-header">
                <h1>Paramètres</h1>

                <Link className="button-link secondary-button" to="/">
                    Retour
                </Link>
            </header>

            <section className="settings-panel">
                <h2>Préférences culinaires</h2>

                <form className="settings-form" onSubmit={savePreferences}>
                    <label htmlFor="diet">
                        Régime alimentaire
                    </label>

                    <input
                        id="diet"
                        type="text"
                        value={diet}
                        onChange={(event) => setDiet(event.target.value)}
                        placeholder="Végétarien, sans gluten..."
                    />

                    <label htmlFor="allergies">
                        Allergies
                    </label>

                    <input
                        id="allergies"
                        type="text"
                        value={allergies}
                        onChange={(event) => setAllergies(event.target.value)}
                        placeholder="Arachides, lactose..."
                    />

                    <label htmlFor="favorite-cuisine">
                        Cuisine préférée
                    </label>

                    <input
                        id="favorite-cuisine"
                        type="text"
                        value={favoriteCuisine}
                        onChange={(event) => setFavoriteCuisine(event.target.value)}
                        placeholder="Italienne, japonaise..."
                    />

                    <label htmlFor="default-servings">
                        Nombre de portions par défaut
                    </label>

                    <input
                        id="default-servings"
                        type="number"
                        min="1"
                        value={defaultServings}
                        onChange={(event) =>
                            setDefaultServings(event.target.value)
                        }
                    />

                    <button type="submit">
                        Enregistrer les préférences
                    </button>
                </form>

                {preferencesMessage && (
                    <p
                        className={
                            preferencesSuccess
                                ? "success-message"
                                : "error-message"
                        }
                    >
                        {preferencesMessage}
                    </p>
                )}
            </section>

            <section className="settings-panel">
                <h2>Changer le mot de passe</h2>

                <form className="settings-form" onSubmit={changePassword}>
                    <label htmlFor="current-password">
                        Mot de passe actuel
                    </label>

                    <input
                        id="current-password"
                        type="password"
                        value={currentPassword}
                        onChange={(event) =>
                            setCurrentPassword(event.target.value)
                        }
                        required
                    />

                    <label htmlFor="new-password">
                        Nouveau mot de passe
                    </label>

                    <input
                        id="new-password"
                        type="password"
                        minLength={6}
                        value={newPassword}
                        onChange={(event) =>
                            setNewPassword(event.target.value)
                        }
                        required
                    />

                    <label htmlFor="confirm-password">
                        Confirmer le nouveau mot de passe
                    </label>

                    <input
                        id="confirm-password"
                        type="password"
                        minLength={6}
                        value={confirmPassword}
                        onChange={(event) =>
                            setConfirmPassword(event.target.value)
                        }
                        required
                    />

                    <button type="submit">
                        Modifier le mot de passe
                    </button>
                </form>

                {passwordMessage && (
                    <p
                        className={
                            passwordSuccess
                                ? "success-message"
                                : "error-message"
                        }
                    >
                        {passwordMessage}
                    </p>
                )}
            </section>
        </main>
    )
}

export default Settings