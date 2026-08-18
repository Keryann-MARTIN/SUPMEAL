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

router.get("/:id/members", auth, async (req, res) => {
    try {
        const cookbookId = Number(req.params.id)

        const membership = await prisma.cookbookMember.findUnique({
            where: {
                userId_cookbookId: {
                    userId: req.userId,
                    cookbookId
                }
            }
        })

        if (!membership) {
            return res.status(403).json({
                message: "Vous n'avez pas accès à ce cookbook"
            })
        }

        const members = await prisma.cookbookMember.findMany({
            where: {
                cookbookId
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                }
            },
            orderBy: {
                createdAt: "asc"
            }
        })

        const result = members.map((member) => ({
            id: member.id,
            role: member.role,
            user: member.user
        }))

        res.json(result)
    } catch {
        res.status(500).json({
            message: "Erreur lors de la récupération des membres"
        })
    }
})

router.post("/:id/members", auth, async (req, res) => {
    try {
        const cookbookId = Number(req.params.id)
        const { email, role } = req.body

        const owner = await prisma.cookbookMember.findUnique({
            where: {
                userId_cookbookId: {
                    userId: req.userId,
                    cookbookId
                }
            }
        })

        if (!owner || owner.role !== "OWNER") {
            return res.status(403).json({
                message: "Seul le propriétaire peut ajouter des membres"
            })
        }

        if (!email) {
            return res.status(400).json({
                message: "L'email est obligatoire"
            })
        }

        const allowedRoles = ["EDITOR", "READER", "COMMENTATOR"]
        const selectedRole = role || "READER"

        if (!allowedRoles.includes(selectedRole)) {
            return res.status(400).json({
                message: "Rôle invalide"
            })
        }

        const user = await prisma.user.findUnique({
            where: {
                email: email.toLowerCase().trim()
            }
        })

        if (!user) {
            return res.status(404).json({
                message: "Utilisateur introuvable"
            })
        }

        const existingMember = await prisma.cookbookMember.findUnique({
            where: {
                userId_cookbookId: {
                    userId: user.id,
                    cookbookId
                }
            }
        })

        if (existingMember) {
            return res.status(409).json({
                message: "Cet utilisateur est déjà membre"
            })
        }

        const member = await prisma.cookbookMember.create({
            data: {
                userId: user.id,
                cookbookId,
                role: selectedRole
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                }
            }
        })

        res.status(201).json(member)
    } catch {
        res.status(500).json({
            message: "Erreur lors de l'ajout du membre"
        })
    }
})

router.patch("/:id/members/:memberId", auth, async (req, res) => {
    try {
        const cookbookId = Number(req.params.id)
        const memberId = Number(req.params.memberId)
        const { role } = req.body

        const owner = await prisma.cookbookMember.findUnique({
            where: {
                userId_cookbookId: {
                    userId: req.userId,
                    cookbookId
                }
            }
        })

        if (!owner || owner.role !== "OWNER") {
            return res.status(403).json({
                message: "Seul le propriétaire peut modifier les rôles"
            })
        }

        const allowedRoles = ["EDITOR", "READER", "COMMENTATOR"]

        if (!allowedRoles.includes(role)) {
            return res.status(400).json({
                message: "Rôle invalide"
            })
        }

        const member = await prisma.cookbookMember.findFirst({
            where: {
                id: memberId,
                cookbookId
            }
        })

        if (!member) {
            return res.status(404).json({
                message: "Membre introuvable"
            })
        }

        if (member.role === "OWNER") {
            return res.status(400).json({
                message: "Le rôle du propriétaire ne peut pas être modifié"
            })
        }

        const updatedMember = await prisma.cookbookMember.update({
            where: {
                id: memberId
            },
            data: {
                role
            }
        })

        res.json(updatedMember)
    } catch {
        res.status(500).json({
            message: "Erreur lors de la modification du rôle"
        })
    }
})

router.delete("/:id/members/:memberId", auth, async (req, res) => {
    try {
        const cookbookId = Number(req.params.id)
        const memberId = Number(req.params.memberId)

        const owner = await prisma.cookbookMember.findUnique({
            where: {
                userId_cookbookId: {
                    userId: req.userId,
                    cookbookId
                }
            }
        })

        if (!owner || owner.role !== "OWNER") {
            return res.status(403).json({
                message: "Seul le propriétaire peut supprimer des membres"
            })
        }

        const member = await prisma.cookbookMember.findFirst({
            where: {
                id: memberId,
                cookbookId
            }
        })

        if (!member) {
            return res.status(404).json({
                message: "Membre introuvable"
            })
        }

        if (member.role === "OWNER") {
            return res.status(400).json({
                message: "Le propriétaire ne peut pas être supprimé"
            })
        }

        await prisma.cookbookMember.delete({
            where: {
                id: memberId
            }
        })

        res.json({
            message: "Membre supprimé"
        })
    } catch {
        res.status(500).json({
            message: "Erreur lors de la suppression du membre"
        })
    }
})

router.get("/:id/messages", auth, async (req, res) => {
    try {
        const cookbookId = Number(req.params.id)

        const member = await prisma.cookbookMember.findUnique({
            where: {
                userId_cookbookId: {
                    userId: req.userId,
                    cookbookId
                }
            }
        })

        if (!member) {
            return res.status(403).json({
                message: "Vous n'avez pas accès à ce cookbook"
            })
        }

        const messages = await prisma.message.findMany({
            where: {
                cookbookId
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            },
            orderBy: {
                createdAt: "asc"
            },
            take: 100
        })

        res.json(messages)
    } catch {
        res.status(500).json({
            message: "Erreur lors de la récupération des messages"
        })
    }
})

router.post("/:id/messages", auth, async (req, res) => {
    try {
        const cookbookId = Number(req.params.id)
        const { content } = req.body

        if (!content || !content.trim()) {
            return res.status(400).json({
                message: "Le message est obligatoire"
            })
        }

        const member = await prisma.cookbookMember.findUnique({
            where: {
                userId_cookbookId: {
                    userId: req.userId,
                    cookbookId
                }
            }
        })

        if (!member) {
            return res.status(403).json({
                message: "Vous n'avez pas accès à ce cookbook"
            })
        }

        const message = await prisma.message.create({
            data: {
                content: content.trim(),
                userId: req.userId,
                cookbookId
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        })

        const io = req.app.get("io")

        io.emit("cookbook-messages-updated", {
            cookbookId
        })

        res.status(201).json(message)
    } catch {
        res.status(500).json({
            message: "Erreur lors de l'envoi du message"
        })
    }
})

module.exports = router