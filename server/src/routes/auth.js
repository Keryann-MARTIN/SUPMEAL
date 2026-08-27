const express = require("express")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")

const prisma = require("../prisma")
const auth = require("../middlewares/auth")

const router = express.Router()

router.post("/register", async (req, res) => {
    try {
        const { name, email, password } = req.body

        if (!name || !email || !password) {
            return res.status(400).json({
                message: "Tous les champs sont obligatoires"
            })
        }

        if (password.length < 6) {
            return res.status(400).json({
                message: "Le mot de passe doit contenir au moins 6 caractères"
            })
        }

        const normalizedEmail = email.toLowerCase().trim()

        const existingUser = await prisma.user.findUnique({
            where: {
                email: normalizedEmail
            }
        })

        if (existingUser) {
            return res.status(409).json({
                message: "Un compte existe déjà avec cet email"
            })
        }

        const passwordHash = await bcrypt.hash(password, 10)

        const user = await prisma.user.create({
            data: {
                name: name.trim(),
                email: normalizedEmail,
                passwordHash
            }
        })

        res.status(201).json({
            id: user.id,
            name: user.name,
            email: user.email
        })
    } catch {
        res.status(500).json({
            message: "Erreur lors de la création du compte"
        })
    }
})

router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body

        if (!email || !password) {
            return res.status(400).json({
                message: "Email et mot de passe obligatoires"
            })
        }

        const normalizedEmail = email.toLowerCase().trim()

        const user = await prisma.user.findUnique({
            where: {
                email: normalizedEmail
            }
        })

        if (!user) {
            return res.status(401).json({
                message: "Email ou mot de passe incorrect"
            })
        }

        const passwordIsValid = await bcrypt.compare(
            password,
            user.passwordHash
        )

        if (!passwordIsValid) {
            return res.status(401).json({
                message: "Email ou mot de passe incorrect"
            })
        }

        const token = jwt.sign(
            {
                userId: user.id
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "7d"
            }
        )

        res.json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email
            }
        })
    } catch {
        res.status(500).json({
            message: "Erreur lors de la connexion"
        })
    }
})

router.get("/me", auth, async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: {
                id: req.userId
            },
            select: {
                id: true,
                name: true,
                email: true,
                diet: true,
                allergies: true,
                favoriteCuisine: true,
                defaultServings: true,
                createdAt: true
            }
        })

        if (!user) {
            return res.status(404).json({
                message: "Utilisateur introuvable"
            })
        }

        res.json(user)
    } catch {
        res.status(500).json({
            message: "Erreur lors de la récupération du profil"
        })
    }
})

router.patch("/password", auth, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                message: "Les deux mots de passe sont obligatoires"
            })
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                message: "Le nouveau mot de passe doit contenir au moins 6 caractères"
            })
        }

        const user = await prisma.user.findUnique({
            where: {
                id: req.userId
            }
        })

        if (!user) {
            return res.status(404).json({
                message: "Utilisateur introuvable"
            })
        }

        const validPassword = await bcrypt.compare(
            currentPassword,
            user.passwordHash
        )

        if (!validPassword) {
            return res.status(401).json({
                message: "Mot de passe actuel incorrect"
            })
        }

        const passwordHash = await bcrypt.hash(newPassword, 10)

        await prisma.user.update({
            where: {
                id: req.userId
            },
            data: {
                passwordHash
            }
        })

        res.json({
            message: "Mot de passe modifié"
        })
    } catch {
        res.status(500).json({
            message: "Erreur lors de la modification du mot de passe"
        })
    }
})

router.patch("/preferences", auth, async (req, res) => {
    try {
        const {
            diet,
            allergies,
            favoriteCuisine,
            defaultServings
        } = req.body

        if (
            defaultServings !== undefined &&
            Number(defaultServings) < 1
        ) {
            return res.status(400).json({
                message: "Le nombre de portions doit être supérieur à 0"
            })
        }

        const user = await prisma.user.update({
            where: {
                id: req.userId
            },
            data: {
                diet: diet?.trim() || null,
                allergies: Array.isArray(allergies)
                    ? allergies.map((allergy) => String(allergy).trim()).filter(Boolean)
                    : [],
                favoriteCuisine: favoriteCuisine?.trim() || null,
                defaultServings: Number(defaultServings) || 1
            },
            select: {
                diet: true,
                allergies: true,
                favoriteCuisine: true,
                defaultServings: true
            }
        })

        res.json({
            message: "Préférences enregistrées",
            preferences: user
        })
    } catch {
        res.status(500).json({
            message: "Erreur lors de l'enregistrement des préférences"
        })
    }
})

module.exports = router