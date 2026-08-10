const express = require("express")

const prisma = require("../prisma")
const auth = require("../middlewares/auth")

const router = express.Router()

router.post("/", auth, async (req, res) => {
    try {
        const {
            title,
            ingredients,
            steps,
            prepTime,
            cookTime,
            servings,
            tags,
            imageUrl,
            source,
            cookbookId
        } = req.body

        if (!title || !ingredients?.length || !steps?.length) {
            return res.status(400).json({
                message: "Titre, ingrédients et étapes obligatoires"
            })
        }

        if (cookbookId) {
            const member = await prisma.cookbookMember.findUnique({
                where: {
                    userId_cookbookId: {
                        userId: req.userId,
                        cookbookId: Number(cookbookId)
                    }
                }
            })

            if (!member) {
                return res.status(403).json({
                    message: "Vous n'avez pas accès à ce cookbook"
                })
            }
        }

        const recipe = await prisma.recipe.create({
            data: {
                title: title.trim(),
                ingredients,
                steps,
                prepTime: Number(prepTime) || 0,
                cookTime: Number(cookTime) || 0,
                servings: Number(servings) || 1,
                tags: tags || [],
                imageUrl: imageUrl?.trim() || null,
                source: source?.trim() || null,
                cookbookId: cookbookId ? Number(cookbookId) : null,
                userId: req.userId
            }
        })

        res.status(201).json(recipe)
    } catch {
        res.status(500).json({
            message: "Erreur lors de la création de la recette"
        })
    }
})

router.get("/", auth, async (req, res) => {
    try {
        const {
            search,
            cookbookId,
            tag,
            ingredient,
            maxPrepTime,
            maxCookTime,
            favorite
        } = req.query

        const conditions = [
            {
                OR: [
                    {
                        userId: req.userId,
                        cookbookId: null
                    },
                    {
                        cookbook: {
                            members: {
                                some: {
                                    userId: req.userId
                                }
                            }
                        }
                    }
                ]
            }
        ]

        if (cookbookId === "personal") {
            conditions.push({
                userId: req.userId,
                cookbookId: null
            })
        } else if (cookbookId) {
            conditions.push({
                cookbookId: Number(cookbookId)
            })
        }

        if (favorite === "true") {
            conditions.push({
                favorite: true
            })
        }

        if (maxPrepTime) {
            conditions.push({
                prepTime: {
                    lte: Number(maxPrepTime)
                }
            })
        }

        if (maxCookTime) {
            conditions.push({
                cookTime: {
                    lte: Number(maxCookTime)
                }
            })
        }

        const recipes = await prisma.recipe.findMany({
            where: {
                AND: conditions
            },
            include: {
                cookbook: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            },
            orderBy: {
                createdAt: "desc"
            }
        })

        let result = recipes

        if (tag) {
            const value = tag.toLowerCase()

            result = result.filter((recipe) =>
                recipe.tags.some((recipeTag) =>
                    recipeTag.toLowerCase().includes(value)
                )
            )
        }

        if (ingredient) {
            const value = ingredient.toLowerCase()

            result = result.filter((recipe) =>
                recipe.ingredients.some((recipeIngredient) =>
                    recipeIngredient.toLowerCase().includes(value)
                )
            )
        }

        if (search) {
            const value = search.toLowerCase()

            result = result.filter((recipe) => {
                const content = [
                    recipe.title,
                    recipe.source || "",
                    recipe.cookbook?.name || "",
                    ...recipe.ingredients,
                    ...recipe.steps,
                    ...recipe.tags
                ]
                    .join(" ")
                    .toLowerCase()

                return content.includes(value)
            })
        }

        res.json(result)
    } catch {
        res.status(500).json({
            message: "Erreur lors de la récupération des recettes"
        })
    }
})

router.patch("/:id", auth, async (req, res) => {
    try {
        const recipeId = Number(req.params.id)
        const {
            favorite,
            plannedAt,
            title,
            ingredients,
            steps,
            prepTime,
            cookTime,
            servings,
            tags,
            imageUrl,
            source,
            cookbookId
        } = req.body

        if (!recipeId) {
            return res.status(400).json({
                message: "Recette invalide"
            })
        }

        const recipe = await prisma.recipe.findFirst({
            where: {
                id: recipeId,
                OR: [
                    {
                        userId: req.userId,
                        cookbookId: null
                    },
                    {
                        cookbook: {
                            members: {
                                some: {
                                    userId: req.userId
                                }
                            }
                        }
                    }
                ]
            }
        })

        if (!recipe) {
            return res.status(404).json({
                message: "Recette introuvable"
            })
        }

        const data = {}

        if (typeof favorite === "boolean") {
            data.favorite = favorite
        }

        if (plannedAt !== undefined) {
            if (plannedAt) {
                const date = new Date(plannedAt)

                if (Number.isNaN(date.getTime())) {
                    return res.status(400).json({
                        message: "Date invalide"
                    })
                }

                data.plannedAt = date
            } else {
                data.plannedAt = null
            }
        }

        if (title !== undefined && title.trim()) {
            data.title = title.trim()
        }

        if (prepTime !== undefined) {
            data.prepTime = Number(prepTime)
        }

        if (cookTime !== undefined) {
            data.cookTime = Number(cookTime)
        }

        if (servings !== undefined) {
            data.servings = Number(servings)
        }
        if (title !== undefined && title.trim()) {
            data.title = title.trim()
        }

        if (ingredients !== undefined && ingredients.length > 0) {
            data.ingredients = ingredients
        }

        if (steps !== undefined && steps.length > 0) {
            data.steps = steps
        }

        if (prepTime !== undefined) {
            data.prepTime = Number(prepTime)
        }

        if (cookTime !== undefined) {
            data.cookTime = Number(cookTime)
        }

        if (servings !== undefined) {
            data.servings = Number(servings)
        }

        if (tags !== undefined) {
            data.tags = tags
        }

        if (imageUrl !== undefined) {
            data.imageUrl = imageUrl?.trim() || null
        }

        if (source !== undefined) {
            data.source = source?.trim() || null
        }

        if (cookbookId !== undefined) {
            if (cookbookId === null) {
                data.cookbookId = null
            } else {
                const member = await prisma.cookbookMember.findUnique({
                    where: {
                        userId_cookbookId: {
                            userId: req.userId,
                            cookbookId: Number(cookbookId)
                        }
                    }
                })

                if (!member) {
                    return res.status(403).json({
                        message: "Vous n'avez pas accès à ce cookbook"
                    })
                }

                data.cookbookId = Number(cookbookId)
            }
        }

        const updatedRecipe = await prisma.recipe.update({
            where: {
                id: recipeId
            },
            data
        })

        res.json(updatedRecipe)
    } catch {
        res.status(500).json({
            message: "Erreur lors de la modification de la recette"
        })
    }
})

router.delete("/:id", auth, async (req, res) => {
    try {
        const recipeId = Number(req.params.id)

        const recipe = await prisma.recipe.findFirst({
            where: {
                id: recipeId,
                userId: req.userId
            }
        })

        if (!recipe) {
            return res.status(404).json({
                message: "Recette introuvable"
            })
        }

        await prisma.recipe.delete({
            where: {
                id: recipeId
            }
        })

        res.json({
            message: "Recette supprimée"
        })
    } catch {
        res.status(500).json({
            message: "Erreur lors de la suppression de la recette"
        })
    }
})

module.exports = router