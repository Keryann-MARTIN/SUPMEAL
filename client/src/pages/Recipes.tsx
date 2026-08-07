import { useEffect, useState } from "react"
import type { SyntheticEvent } from "react"
import { Link, useNavigate } from "react-router-dom"

type Cookbook = {
    id: number
    name: string
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
    source: string | null
    favorite: boolean
    plannedAt: string | null
    cookbook: Cookbook | null
}

function Recipes() {
    const navigate = useNavigate()

    const [recipes, setRecipes] = useState<Recipe[]>([])
    const [cookbooks, setCookbooks] = useState<Cookbook[]>([])

    const [title, setTitle] = useState("")
    const [ingredients, setIngredients] = useState("")
    const [steps, setSteps] = useState("")
    const [prepTime, setPrepTime] = useState("")
    const [cookTime, setCookTime] = useState("")
    const [servings, setServings] = useState("1")
    const [tags, setTags] = useState("")
    const [source, setSource] = useState("")
    const [cookbookId, setCookbookId] = useState("")
    const [message, setMessage] = useState("")

    const [search, setSearch] = useState("")
    const [filterCookbook, setFilterCookbook] = useState("")
    const [filterTag, setFilterTag] = useState("")
    const [filterIngredient, setFilterIngredient] = useState("")
    const [maxPrepTime, setMaxPrepTime] = useState("")
    const [maxCookTime, setMaxCookTime] = useState("")
    const [favoriteOnly, setFavoriteOnly] = useState(false)

    async function loadRecipes(token: string, query = "") {
        const response = await fetch(`http://localhost:3000/recipes${query}`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        })

        if (!response.ok) {
            throw new Error()
        }

        const data = await response.json()
        setRecipes(data)
    }

    function getFilterQuery() {
        const params = new URLSearchParams()

        if (search.trim()) {
            params.set("search", search.trim())
        }

        if (filterCookbook) {
            params.set("cookbookId", filterCookbook)
        }

        if (filterTag.trim()) {
            params.set("tag", filterTag.trim())
        }

        if (filterIngredient.trim()) {
            params.set("ingredient", filterIngredient.trim())
        }

        if (maxPrepTime) {
            params.set("maxPrepTime", maxPrepTime)
        }

        if (maxCookTime) {
            params.set("maxCookTime", maxCookTime)
        }

        if (favoriteOnly) {
            params.set("favorite", "true")
        }

        const query = params.toString()

        return query ? `?${query}` : ""
    }

    async function handleFilters(event: SyntheticEvent<HTMLFormElement>) {
        event.preventDefault()

        const token = localStorage.getItem("token")

        if (!token) {
            navigate("/login")
            return
        }

        await loadRecipes(token, getFilterQuery())
    }

    async function resetFilters() {
        setSearch("")
        setFilterCookbook("")
        setFilterTag("")
        setFilterIngredient("")
        setMaxPrepTime("")
        setMaxCookTime("")
        setFavoriteOnly(false)

        const token = localStorage.getItem("token")

        if (token) {
            await loadRecipes(token)
        }
    }

    async function updateRecipe(
        recipeId: number,
        data: {
            favorite?: boolean
            plannedAt?: string | null
        }
    ) {
        const token = localStorage.getItem("token")

        if (!token) {
            navigate("/login")
            return
        }

        const response = await fetch(`http://localhost:3000/recipes/${recipeId}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(data)
        })

        const responseData = await response.json()

        if (!response.ok) {
            setMessage(responseData.message)
            return
        }

        await loadRecipes(token)
    }

    useEffect(() => {
        const token = localStorage.getItem("token")

        if (!token) {
            navigate("/login")
            return
        }

        async function loadData(authToken: string) {
            try {
                const cookbookResponse = await fetch("http://localhost:3000/cookbooks", {
                    headers: {
                        Authorization: `Bearer ${authToken}`
                    }
                })

                if (!cookbookResponse.ok) {
                    throw new Error()
                }

                const cookbookData = await cookbookResponse.json()

                setCookbooks(cookbookData)
                await loadRecipes(authToken)
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

        const ingredientList = ingredients
            .split("\n")
            .map((ingredient) => ingredient.trim())
            .filter(Boolean)

        const stepList = steps
            .split("\n")
            .map((step) => step.trim())
            .filter(Boolean)

        const tagList = tags
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean)

        const response = await fetch("http://localhost:3000/recipes", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
                title,
                ingredients: ingredientList,
                steps: stepList,
                prepTime: Number(prepTime),
                cookTime: Number(cookTime),
                servings: Number(servings),
                tags: tagList,
                source,
                cookbookId: cookbookId ? Number(cookbookId) : null
            })
        })

        const data = await response.json()

        if (!response.ok) {
            setMessage(data.message)
            return
        }

        setTitle("")
        setIngredients("")
        setSteps("")
        setPrepTime("")
        setCookTime("")
        setServings("1")
        setTags("")
        setSource("")
        setCookbookId("")

        await loadRecipes(token)
    }

    return (
        <main className="recipes-page">
            <div className="page-header">
                <div>
                    <h1>Recettes</h1>
                    <Link to="/">Retour aux cookbooks</Link>
                </div>
            </div>

            <div className="recipes-layout">
                <section className="panel">
                    <h2>Ajouter une recette</h2>

                    <form className="recipe-form" onSubmit={handleSubmit}>
                        <label htmlFor="title">Titre</label>
                        <input
                            id="title"
                            value={title}
                            onChange={(event) => setTitle(event.target.value)}
                            required
                        />

                        <label htmlFor="ingredients">Ingrédients</label>
                        <textarea
                            id="ingredients"
                            value={ingredients}
                            onChange={(event) => setIngredients(event.target.value)}
                            rows={5}
                            placeholder="Un ingrédient par ligne"
                            required
                        />

                        <label htmlFor="steps">Étapes</label>
                        <textarea
                            id="steps"
                            value={steps}
                            onChange={(event) => setSteps(event.target.value)}
                            rows={5}
                            placeholder="Une étape par ligne"
                            required
                        />

                        <label htmlFor="prep-time">Temps de préparation (min)</label>
                        <input
                            id="prep-time"
                            type="number"
                            min="0"
                            value={prepTime}
                            onChange={(event) => setPrepTime(event.target.value)}
                        />

                        <label htmlFor="cook-time">Temps de cuisson (min)</label>
                        <input
                            id="cook-time"
                            type="number"
                            min="0"
                            value={cookTime}
                            onChange={(event) => setCookTime(event.target.value)}
                        />

                        <label htmlFor="servings">Portions</label>
                        <input
                            id="servings"
                            type="number"
                            min="1"
                            value={servings}
                            onChange={(event) => setServings(event.target.value)}
                        />

                        <label htmlFor="tags">Tags</label>
                        <input
                            id="tags"
                            value={tags}
                            onChange={(event) => setTags(event.target.value)}
                            placeholder="Facile, Dessert, Rapide"
                        />

                        <label htmlFor="source">Source</label>
                        <input
                            id="source"
                            value={source}
                            onChange={(event) => setSource(event.target.value)}
                        />

                        <label htmlFor="cookbook">Cookbook</label>
                        <select
                            id="cookbook"
                            value={cookbookId}
                            onChange={(event) => setCookbookId(event.target.value)}
                        >
                            <option value="">Recette personnelle</option>

                            {cookbooks.map((cookbook) => (
                                <option key={cookbook.id} value={cookbook.id}>
                                    {cookbook.name}
                                </option>
                            ))}
                        </select>

                        {message && <p className="error-message">{message}</p>}

                        <button type="submit">Ajouter</button>
                    </form>
                </section>

                <section className="panel">
                    <h2>Mes recettes</h2>

                    <form className="recipe-filters" onSubmit={handleFilters}>
                        <input
                            type="text"
                            placeholder="Rechercher..."
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                        />

                        <select
                            value={filterCookbook}
                            onChange={(event) => setFilterCookbook(event.target.value)}
                        >
                            <option value="">Tous les cookbooks</option>
                            <option value="personal">Recettes personnelles</option>

                            {cookbooks.map((cookbook) => (
                                <option key={cookbook.id} value={cookbook.id}>
                                    {cookbook.name}
                                </option>
                            ))}
                        </select>

                        <input
                            type="text"
                            placeholder="Tag"
                            value={filterTag}
                            onChange={(event) => setFilterTag(event.target.value)}
                        />

                        <input
                            type="text"
                            placeholder="Ingrédient"
                            value={filterIngredient}
                            onChange={(event) => setFilterIngredient(event.target.value)}
                        />

                        <input
                            type="number"
                            min="0"
                            placeholder="Préparation max (min)"
                            value={maxPrepTime}
                            onChange={(event) => setMaxPrepTime(event.target.value)}
                        />

                        <input
                            type="number"
                            min="0"
                            placeholder="Cuisson max (min)"
                            value={maxCookTime}
                            onChange={(event) => setMaxCookTime(event.target.value)}
                        />

                        <label className="favorite-filter">
                            <input
                                type="checkbox"
                                checked={favoriteOnly}
                                onChange={(event) => setFavoriteOnly(event.target.checked)}
                            />
                            Favoris uniquement
                        </label>

                        <div className="filter-buttons">
                            <button type="submit">Filtrer</button>

                            <button
                                type="button"
                                className="secondary-button"
                                onClick={resetFilters}
                            >
                                Réinitialiser
                            </button>
                        </div>
                    </form>

                    {recipes.length === 0 ? (
                        <p>Aucune recette pour le moment.</p>
                    ) : (
                        <div className="recipe-list">
                            {recipes.map((recipe) => (
                                <article className="recipe-card" key={recipe.id}>
                                    <h3>{recipe.title}</h3>

                                    <div className="recipe-actions">
                                        <button
                                            type="button"
                                            className="favorite-button"
                                            onClick={() =>
                                                updateRecipe(recipe.id, {
                                                    favorite: !recipe.favorite
                                                })
                                            }
                                        >
                                            {recipe.favorite ? "★ Favori" : "☆ Ajouter aux favoris"}
                                        </button>

                                        <div className="planning">
                                            <label htmlFor={`planning-${recipe.id}`}>Repas prévu</label>

                                            <input
                                                id={`planning-${recipe.id}`}
                                                type="date"
                                                value={recipe.plannedAt ? recipe.plannedAt.slice(0, 10) : ""}
                                                onChange={(event) =>
                                                    updateRecipe(recipe.id, {
                                                        plannedAt: event.target.value || null
                                                    })
                                                }
                                            />
                                        </div>
                                    </div>

                                    <p>
                                        {recipe.prepTime} min de préparation · {recipe.cookTime} min de cuisson
                                    </p>

                                    <p>{recipe.servings} portion(s)</p>

                                    <p>
                                        {recipe.cookbook
                                            ? `Cookbook : ${recipe.cookbook.name}`
                                            : "Recette personnelle"}
                                    </p>

                                    {recipe.tags.length > 0 && (
                                        <p>Tags : {recipe.tags.join(", ")}</p>
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
                                </article>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </main>
    )
}

export default Recipes