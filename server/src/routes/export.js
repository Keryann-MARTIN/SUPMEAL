const express = require("express")

const prisma = require("../prisma")
const auth = require("../middlewares/auth")

const router = express.Router()

function formatRecipe(recipe) {
    return {
        title: recipe.title,
        ingredients: recipe.ingredients,
        steps: recipe.steps,
        prepTime: recipe.prepTime,
        cookTime: recipe.cookTime,
        servings: recipe.servings,
        tags: recipe.tags,
        imageUrl: recipe.imageUrl,
        source: recipe.source,
        favorite: recipe.favorite,
        plannedAt: recipe.plannedAt
    }
}

router.get("/", auth, async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: {
                id: req.userId
            },
            select: {
                name: true,
                email: true
            }
        })

        const personalRecipes = await prisma.recipe.findMany({
            where: {
                userId: req.userId,
                cookbookId: null
            },
            orderBy: {
                createdAt: "asc"
            }
        })

        const cookbooks = await prisma.cookbook.findMany({
            where: {
                members: {
                    some: {
                        userId: req.userId,
                        role: "OWNER"
                    }
                }
            },
            include: {
                recipes: {
                    orderBy: {
                        createdAt: "asc"
                    }
                }
            },
            orderBy: {
                createdAt: "asc"
            }
        })

        const exportData = {
            exportedAt: new Date().toISOString(),
            user,
            personalRecipes: personalRecipes.map(formatRecipe),
            cookbooks: cookbooks.map((cookbook) => ({
                name: cookbook.name,
                description: cookbook.description,
                recipes: cookbook.recipes.map(formatRecipe)
            }))
        }

        res.setHeader(
            "Content-Disposition",
            "attachment; filename=supmeal-export.json"
        )

        res.json(exportData)
    } catch {
        res.status(500).json({
            message: "Erreur lors de l'export"
        })
    }
})

module.exports = router