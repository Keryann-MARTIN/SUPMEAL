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
        const recipes = await prisma.recipe.findMany({
            where: {
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

        res.json(recipes)
    } catch {
        res.status(500).json({
            message: "Erreur lors de la récupération des recettes"
        })
    }
})

module.exports = router