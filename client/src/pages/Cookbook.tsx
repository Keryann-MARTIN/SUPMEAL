import { useCallback, useEffect, useState } from "react"
import type { SyntheticEvent } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"

type CookbookData = {
    id: number
    name: string
    description: string | null
    role: string
}

type Recipe = {
    id: number
    title: string
    ingredients: string[]
    steps: string[]
    prepTime: number
    cookTime: number
    servings: number
    tags: string[]
    imageUrl: string | null
    source: string | null
    favorite: boolean
}

function Cookbook() {
    const { id } = useParams()
    const navigate = useNavigate()

    const [cookbook, setCookbook] = useState<CookbookData | null>(null)
    const [recipes, setRecipes] = useState<Recipe[]>([])
    const [search, setSearch] = useState("")
    const [message, setMessage] = useState("")

    const loadRecipes = useCallback(
        async (token: string, searchValue = "") => {
            const params = new URLSearchParams()

            params.set("cookbookId", String(id))

            if (searchValue.trim()) {
                params.set("search", searchValue.trim())
            }

            const response = await fetch(
                `http://localhost:3000/recipes?${params.toString()}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            )

            const data = await response.json()

            if (!response.ok) {
                setMessage(data.message)
                return
            }

            setRecipes(data)
        },
        [id]
    )

    useEffect(() => {
        const token = localStorage.getItem("token")

        if (!token) {
            navigate("/login")
            return
        }

        async function loadCookbook(authToken: string) {
            try {
                const response = await fetch("http://localhost:3000/cookbooks", {
                    headers: {
                        Authorization: `Bearer ${authToken}`
                    }
                })

                const data = await response.json()

                if (!response.ok) {
                    throw new Error()
                }

                const currentCookbook = data.find(
                    (item: CookbookData) => item.id === Number(id)
                )

                if (!currentCookbook) {
                    setMessage("Cookbook introuvable")
                    return
                }

                setCookbook(currentCookbook)

                await loadRecipes(authToken)
            } catch {
                setMessage("Impossible de charger le cookbook")
            }
        }

        loadCookbook(token)
    }, [id, navigate, loadRecipes])

    async function handleSearch(event: SyntheticEvent<HTMLFormElement>) {
        event.preventDefault()

        const token = localStorage.getItem("token")

        if (!token) {
            navigate("/login")
            return
        }

        await loadRecipes(token, search)
    }

    async function resetSearch() {
        const token = localStorage.getItem("token")

        if (!token) {
            navigate("/login")
            return
        }

        setSearch("")
        await loadRecipes(token)
    }

    if (message && !cookbook) {
        return (
            <main className="cookbook-page">
                <p className="error-message">{message}</p>

                <Link className="button-link" to="/">
                    Retour
                </Link>
            </main>
        )
    }

    if (!cookbook) {
        return <p className="loading">Chargement...</p>
    }

    return (
        <main className="cookbook-page">
            <header className="page-header">
                <div>
                    <h1>{cookbook.name}</h1>

                    {cookbook.description && (
                        <p>{cookbook.description}</p>
                    )}

                    <span className="cookbook-role">
                        {cookbook.role}
                    </span>
                </div>

                <div className="header-actions">
                    <Link className="button-link" to="/recipes">
                        Toutes les recettes
                    </Link>

                    <Link className="button-link secondary-button" to="/">
                        Retour
                    </Link>
                </div>
            </header>

            <section className="cookbook-search">
                <h2>Rechercher dans ce cookbook</h2>

                <form onSubmit={handleSearch}>
                    <input
                        type="text"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Titre, ingrédient, tag..."
                    />

                    <button type="submit">
                        Rechercher
                    </button>

                    <button
                        type="button"
                        className="secondary-button"
                        onClick={resetSearch}
                    >
                        Réinitialiser
                    </button>
                </form>
            </section>

            <section className="cookbook-recipes">
                <h2>Recettes</h2>

                {message && (
                    <p className="error-message">{message}</p>
                )}

                {recipes.length === 0 ? (
                    <p>Aucune recette trouvée.</p>
                ) : (
                    <div className="cookbook-recipe-list">
                        {recipes.map((recipe) => (
                            <article
                                className="cookbook-recipe-card"
                                key={recipe.id}
                            >
                                {recipe.imageUrl && (
                                    <img
                                        className="recipe-image"
                                        src={recipe.imageUrl}
                                        alt={recipe.title}
                                    />
                                )}

                                <h3>{recipe.title}</h3>

                                <p>
                                    Préparation : {recipe.prepTime} min | Cuisson :{" "}
                                    {recipe.cookTime} min | Portions : {recipe.servings}
                                </p>

                                {recipe.tags.length > 0 && (
                                    <p>
                                        Tags : {recipe.tags.join(", ")}
                                    </p>
                                )}

                                <h4>Ingrédients</h4>

                                <ul>
                                    {recipe.ingredients.map((ingredient, index) => (
                                        <li key={index}>{ingredient}</li>
                                    ))}
                                </ul>

                                <h4>Étapes</h4>

                                <ol>
                                    {recipe.steps.map((step, index) => (
                                        <li key={index}>{step}</li>
                                    ))}
                                </ol>

                                {recipe.source && (
                                    <p>Source : {recipe.source}</p>
                                )}

                                {recipe.favorite && (
                                    <p>★ Favori</p>
                                )}
                            </article>
                        ))}
                    </div>
                )}
            </section>
        </main>
    )
}

export default Cookbook