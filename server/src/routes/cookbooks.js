const express = require("express")

const prisma = require("../prisma")
const auth = require("../middlewares/auth")

const router = express.Router()

router.post("/", auth, async (req, res) => {
    try {
        const { name, description } = req.body

        if (!name || !name.trim()) {
            return res.status(400).json({
                message: "Le nom du cookbook est obligatoire"
            })
        }

        const cookbook = await prisma.cookbook.create({
            data: {
                name: name.trim(),
                description: description?.trim() || null,
                members: {
                    create: {
                        userId: req.userId,
                        role: "OWNER"
                    }
                }
            }
        })

        res.status(201).json(cookbook)
    } catch {
        res.status(500).json({
            message: "Erreur lors de la création du cookbook"
        })
    }
})

router.get("/", auth, async (req, res) => {
    try {
        const cookbooks = await prisma.cookbook.findMany({
            where: {
                members: {
                    some: {
                        userId: req.userId
                    }
                }
            },
            include: {
                members: {
                    where: {
                        userId: req.userId
                    },
                    select: {
                        role: true
                    }
                }
            },
            orderBy: {
                createdAt: "desc"
            }
        })

        const result = cookbooks.map((cookbook) => ({
            id: cookbook.id,
            name: cookbook.name,
            description: cookbook.description,
            role: cookbook.members[0].role,
            createdAt: cookbook.createdAt
        }))

        res.json(result)
    } catch {
        res.status(500).json({
            message: "Erreur lors de la récupération des cookbooks"
        })
    }
})

module.exports = router