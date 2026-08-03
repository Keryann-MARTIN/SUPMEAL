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

module.exports = router