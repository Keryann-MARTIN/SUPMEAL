const express = require("express")
const cors = require("cors")
require("dotenv").config()

const prisma = require("./prisma")
const authRoutes = require("./routes/auth")
const cookbookRoutes = require("./routes/cookbooks")
const recipeRoutes = require("./routes/recipes")

const app = express()
const port = process.env.PORT || 3000

app.use(cors())
app.use(express.json())

app.use("/auth", authRoutes)
app.use("/cookbooks", cookbookRoutes)
app.use("/recipes", recipeRoutes)

app.get("/", (req, res) => {
    res.json({ message: "API SUPMEAL" })
})

app.get("/health", async (req, res) => {
    try {
        await prisma.user.count()

        res.json({
            api: "ok",
            database: "ok"
        })
    } catch {
        res.status(500).json({
            api: "ok",
            database: "error"
        })
    }
})

app.listen(port, () => {
    console.log(`Serveur démarré sur le port ${port}`)
})