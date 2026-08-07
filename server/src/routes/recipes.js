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
        const { favorite, plannedAt } = req.body

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

module.exports = router