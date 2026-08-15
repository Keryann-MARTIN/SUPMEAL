import { useEffect, useState } from "react"
import type { SyntheticEvent } from "react"
import { Link, useNavigate } from "react-router-dom"

type Cookbook = {
    id: number
    name: string
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
    plannedAt: string | null
    cookbook: Cookbook | null
}

type RecipeComment = {
    id: number
    content: string
    createdAt: string
    user: {
        id: number
        name: string
    }
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

    const [imageUrl, setImageUrl] = useState("")

    const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null)
    const [editTitle, setEditTitle] = useState("")
    const [editPrepTime, setEditPrepTime] = useState("")
    const [editCookTime, setEditCookTime] = useState("")
    const [editServings, setEditServings] = useState("")
    const [editIngredients, setEditIngredients] = useState("")
    const [editSteps, setEditSteps] = useState("")
    const [editTags, setEditTags] = useState("")
    const [editImageUrl, setEditImageUrl] = useState("")
    const [editSource, setEditSource] = useState("")
    const [editCookbookId, setEditCookbookId] = useState("")

    const [openCommentsRecipeId, setOpenCommentsRecipeId] = useState<number | null>(null)
    const [comments, setComments] = useState<RecipeComment[]>([])
    const [commentText, setCommentText] = useState("")
    const [commentMessage, setCommentMessage] = useState("")

    function startEditing(recipe: Recipe) {
        setEditingRecipe(recipe)
        setEditTitle(recipe.title)
        setEditIngredients(recipe.ingredients.join("\n"))
        setEditSteps(recipe.steps.join("\n"))
        setEditPrepTime(String(recipe.prepTime))
        setEditCookTime(String(recipe.cookTime))
        setEditServings(String(recipe.servings))
        setEditTags(recipe.tags.join(", "))
        setEditImageUrl(recipe.imageUrl || "")
        setEditSource(recipe.source || "")
        setEditCookbookId(recipe.cookbook ? String(recipe.cookbook.id) : "")
    }

    async function saveRecipe(event: SyntheticEvent<HTMLFormElement>) {
        event.preventDefault()

        if (!editingRecipe) {
            return
        }

        const token = localStorage.getItem("token")

        if (!token) {
            navigate("/login")
            return
        }

        const ingredientList = editIngredients
            .split("\n")
            .map((ingredient) => ingredient.trim())
            .filter(Boolean)

        const stepList = editSteps
            .split("\n")
            .map((step) => step.trim())
            .filter(Boolean)

        const tagList = editTags
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean)

        const response = await fetch(
            `http://localhost:3000/recipes/${editingRecipe.id}`,
            {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    title: editTitle,
                    ingredients: ingredientList,
                    steps: stepList,
                    prepTime: Number(editPrepTime),
                    cookTime: Number(editCookTime),
                    servings: Number(editServings),
                    tags: tagList,
                    imageUrl: editImageUrl,
                    source: editSource,
                    cookbookId: editCookbookId ? Number(editCookbookId) : null
                })
            }
        )

        const data = await response.json()

        if (!response.ok) {
            setMessage(data.message)
            return
        }

        setEditingRecipe(null)

        await loadRecipes(token, getFilterQuery())
    }

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

        await loadRecipes(token, getFilterQuery())
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
                imageUrl,
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

    async function deleteRecipe(recipeId: number) {
        const token = localStorage.getItem("token")

        if (!token) {
            navigate("/login")
            return
        }

        const confirmed = window.confirm("Supprimer cette recette ?")

        if (!confirmed) {
            return
        }

        const response = await fetch(`http://localhost:3000/recipes/${recipeId}`, {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${token}`
            }
        })

        const data = await response.json()

        if (!response.ok) {
            setMessage(data.message)
            return
        }

        await loadRecipes(token, getFilterQuery())
    }

    async function loadComments(recipeId: number) {
        const token = localStorage.getItem("token")

        if (!token) {
            navigate("/login")
            return
        }

        const response = await fetch(
            `http://localhost:3000/recipes/${recipeId}/comments`,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        )

        const data = await response.json()

        if (!response.ok) {
            setCommentMessage(data.message)
            return
        }

        setComments(data)
    }

    async function toggleComments(recipeId: number) {
        setCommentMessage("")
        setCommentText("")

        if (openCommentsRecipeId === recipeId) {
            setOpenCommentsRecipeId(null)
            setComments([])
            return
        }

        setOpenCommentsRecipeId(recipeId)
        await loadComments(recipeId)
    }

    async function addComment(
        event: SyntheticEvent<HTMLFormElement>,
        recipeId: number
    ) {
        event.preventDefault()

        const token = localStorage.getItem("token")

        if (!token) {
            navigate("/login")
            return
        }

        setCommentMessage("")

        const response = await fetch(
            `http://localhost:3000/recipes/${recipeId}/comments`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    content: commentText
                })
            }
        )

        const data = await response.json()

        if (!response.ok) {
            setCommentMessage(data.message)
            return
        }

        setCommentText("")
        await loadComments(recipeId)
    }

    function canComment(recipe: Recipe) {
        if (!recipe.cookbook) {
            return false
        }

        const cookbook = cookbooks.find(
            (item) => item.id === recipe.cookbook?.id
        )

        if (!cookbook) {
            return false
        }

        return ["OWNER", "EDITOR", "COMMENTATOR"].includes(cookbook.role)
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

                        <label htmlFor="image">Image</label>
                        <input
                            id="image"
                            type="url"
                            value={imageUrl}
                            onChange={(event) => setImageUrl(event.target.value)}
                            placeholder="https://..."
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

                    {editingRecipe && (
                        <form className="edit-recipe-form" onSubmit={saveRecipe}>
                            <h3>Modifier {editingRecipe.title}</h3>

                            <label htmlFor="edit-title">Titre</label>
                            <input
                                id="edit-title"
                                type="text"
                                value={editTitle}
                                onChange={(event) => setEditTitle(event.target.value)}
                                required
                            />

                            <label htmlFor="edit-ingredients">Ingrédients</label>
                            <textarea
                                id="edit-ingredients"
                                value={editIngredients}
                                onChange={(event) => setEditIngredients(event.target.value)}
                                rows={5}
                                required
                            />

                            <label htmlFor="edit-steps">Étapes</label>
                            <textarea
                                id="edit-steps"
                                value={editSteps}
                                onChange={(event) => setEditSteps(event.target.value)}
                                rows={5}
                                required
                            />

                            <label htmlFor="edit-prep-time">Temps de préparation (min)</label>
                            <input
                                id="edit-prep-time"
                                type="number"
                                min="0"
                                value={editPrepTime}
                                onChange={(event) => setEditPrepTime(event.target.value)}
                            />

                            <label htmlFor="edit-cook-time">Temps de cuisson (min)</label>
                            <input
                                id="edit-cook-time"
                                type="number"
                                min="0"
                                value={editCookTime}
                                onChange={(event) => setEditCookTime(event.target.value)}
                            />

                            <label htmlFor="edit-servings">Portions</label>
                            <input
                                id="edit-servings"
                                type="number"
                                min="1"
                                value={editServings}
                                onChange={(event) => setEditServings(event.target.value)}
                            />

                            <label htmlFor="edit-tags">Tags</label>
                            <input
                                id="edit-tags"
                                type="text"
                                value={editTags}
                                onChange={(event) => setEditTags(event.target.value)}
                                placeholder="Facile, Dessert, Rapide"
                            />

                            <label htmlFor="edit-image">Image</label>
                            <input
                                id="edit-image"
                                type="url"
                                value={editImageUrl}
                                onChange={(event) => setEditImageUrl(event.target.value)}
                                placeholder="https://..."
                            />

                            <label htmlFor="edit-source">Source</label>
                            <input
                                id="edit-source"
                                type="text"
                                value={editSource}
                                onChange={(event) => setEditSource(event.target.value)}
                            />

                            <label htmlFor="edit-cookbook">Cookbook</label>
                            <select
                                id="edit-cookbook"
                                value={editCookbookId}
                                onChange={(event) => setEditCookbookId(event.target.value)}
                            >
                                <option value="">Recette personnelle</option>

                                {cookbooks.map((cookbook) => (
                                    <option key={cookbook.id} value={cookbook.id}>
                                        {cookbook.name}
                                    </option>
                                ))}
                            </select>

                            <div className="filter-buttons">
                                <button type="submit">Enregistrer</button>

                                <button
                                    type="button"
                                    className="secondary-button"
                                    onClick={() => setEditingRecipe(null)}
                                >
                                    Annuler
                                </button>
                            </div>
                        </form>
                    )}

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

                                    {recipe.imageUrl && (
                                        <img
                                            className="recipe-image"
                                            src={recipe.imageUrl}
                                            alt={recipe.title}
                                        />
                                    )}

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

                                        <button
                                            type="button"
                                            className="secondary-button"
                                            onClick={() => startEditing(recipe)}
                                        >
                                            Modifier
                                        </button>

                                        <button
                                            type="button"
                                            className="delete-button"
                                            onClick={() => deleteRecipe(recipe.id)}
                                        >
                                            Supprimer
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
                                    {recipe.cookbook && (
                                        <div className="comments-section">
                                            <button
                                                type="button"
                                                className="secondary-button"
                                                onClick={() => toggleComments(recipe.id)}
                                            >
                                                {openCommentsRecipeId === recipe.id
                                                    ? "Masquer les commentaires"
                                                    : "Commentaires"}
                                            </button>

                                            {openCommentsRecipeId === recipe.id && (
                                                <div className="comments-panel">
                                                    <h4>Commentaires</h4>

                                                    {comments.length === 0 ? (
                                                        <p>Aucun commentaire pour le moment.</p>
                                                    ) : (
                                                        <div className="comment-list">
                                                            {comments.map((comment) => (
                                                                <div className="comment-card" key={comment.id}>
                                                                    <div className="comment-header">
                                                                        <strong>{comment.user.name}</strong>

                                                                        <span>
                                                                            {new Date(comment.createdAt).toLocaleString("fr-FR")}
                                                                        </span>
                                                                    </div>

                                                                    <p>{comment.content}</p>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}

                                                    {canComment(recipe) ? (
                                                        <form
                                                            className="comment-form"
                                                            onSubmit={(event) => addComment(event, recipe.id)}
                                                        >
                                                            <label htmlFor={`comment-${recipe.id}`}>
                                                                Ajouter un commentaire
                                                            </label>

                                                            <textarea
                                                                id={`comment-${recipe.id}`}
                                                                value={commentText}
                                                                onChange={(event) => setCommentText(event.target.value)}
                                                                rows={3}
                                                                required
                                                            />

                                                            <button type="submit">Envoyer</button>
                                                        </form>
                                                    ) : (
                                                        <p className="read-only-message">
                                                            Vous pouvez consulter les commentaires mais pas en ajouter.
                                                        </p>
                                                    )}

                                                    {commentMessage && (
                                                        <p className="error-message">{commentMessage}</p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}
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