const express = require("express")
const multer = require("multer")

const prisma = require("../prisma")
const auth = require("../middlewares/auth")

const router = express.Router()

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 2 * 1024 * 1024
    }
})

function prepareRecipe(recipe) {
    if (
        !recipe ||
        !recipe.title ||
        !Array.isArray(recipe.ingredients) ||
        !Array.isArray(recipe.steps) ||
        recipe.ingredients.length === 0 ||
        recipe.steps.length === 0
    ) {
        throw new Error("Recette invalide")
    }

    const plannedAt = recipe.plannedAt
        ? new Date(recipe.plannedAt)
        : null

    if (plannedAt && Number.isNaN(plannedAt.getTime())) {
        throw new Error("Date de planification invalide")
    }

    return {
        title: String(recipe.title).trim(),
        ingredients: recipe.ingredients.map((ingredient) =>
            String(ingredient).trim()
        ),
        steps: recipe.steps.map((step) =>
            String(step).trim()
        ),
        prepTime: Number(recipe.prepTime) || 0,
        cookTime: Number(recipe.cookTime) || 0,
        servings: Number(recipe.servings) || 1,
        tags: Array.isArray(recipe.tags)
            ? recipe.tags.map((tag) => String(tag).trim())
            : [],
        imageUrl: recipe.imageUrl
            ? String(recipe.imageUrl).trim()
            : null,
        source: recipe.source
            ? String(recipe.source).trim()
            : null,
        favorite: Boolean(recipe.favorite),
        plannedAt
    }
}

router.post("/", auth, upload.single("file"), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({
            message: "Aucun fichier fourni"
        })
    }

    if (!req.file.originalname.toLowerCase().endsWith(".json")) {
        return res.status(400).json({
            message: "Le fichier doit être au format JSON"
        })
    }

    let importData

    try {
        importData = JSON.parse(req.file.buffer.toString("utf8"))
    } catch {
        return res.status(400).json({
            message: "Le fichier JSON est invalide"
        })
    }

    if (
        !Array.isArray(importData.personalRecipes) ||
        !Array.isArray(importData.cookbooks)
    ) {
        return res.status(400).json({
            message: "Format d'import invalide"
        })
    }

    try {
        const personalRecipes = importData.personalRecipes.map(prepareRecipe)

        const cookbooks = importData.cookbooks.map((cookbook) => {
            if (!cookbook || !cookbook.name || !Array.isArray(cookbook.recipes)) {
                throw new Error("Cookbook invalide")
            }

            return {
                name: String(cookbook.name).trim(),
                description: cookbook.description
                    ? String(cookbook.description).trim()
                    : null,
                recipes: cookbook.recipes.map(prepareRecipe)
            }
        })

        await prisma.$transaction(async (tx) => {
            for (const recipe of personalRecipes) {
                await tx.recipe.create({
                    data: {
                        ...recipe,
                        userId: req.userId
                    }
                })
            }

            for (const cookbook of cookbooks) {
                await tx.cookbook.create({
                    data: {
                        name: cookbook.name,
                        description: cookbook.description,
                        members: {
                            create: {
                                userId: req.userId,
                                role: "OWNER"
                            }
                        },
                        recipes: {
                            create: cookbook.recipes.map((recipe) => ({
                                ...recipe,
                                user: {
                                    connect: {
                                        id: req.userId
                                    }
                                }
                            }))
                        }
                    }
                })
            }
        })

        res.status(201).json({
            message: "Import terminé",
            personalRecipes: personalRecipes.length,
            cookbooks: cookbooks.length,
            cookbookRecipes: cookbooks.reduce(
                (total, cookbook) => total + cookbook.recipes.length,
                0
            )
        })
    } catch {
        res.status(400).json({
            message: "Le contenu du fichier est invalide"
        })
    }
})

module.exports = router