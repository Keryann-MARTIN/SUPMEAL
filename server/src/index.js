const http = require("http")
const { Server } = require("socket.io")

const express = require("express")
const cors = require("cors")
require("dotenv").config()

const prisma = require("./prisma")
const authRoutes = require("./routes/auth")
const cookbookRoutes = require("./routes/cookbooks")
const recipeRoutes = require("./routes/recipes")
const exportRoutes = require("./routes/export")
const importRoutes = require("./routes/import")

const app = express()
const port = process.env.PORT || 3000

const server = http.createServer(app)

const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173"
    }
})

app.set("io", io)

app.use(cors())
app.use(express.json())

app.use("/auth", authRoutes)
app.use("/cookbooks", cookbookRoutes)
app.use("/recipes", recipeRoutes)
app.use("/export", exportRoutes)
app.use("/import", importRoutes)

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

io.on("connection", (socket) => {
    console.log(`Client Socket.IO connecté : ${socket.id}`)

    socket.on("disconnect", () => {
        console.log(`Client Socket.IO déconnecté : ${socket.id}`)
    })
})

server.listen(port, () => {
    console.log(`Serveur démarré sur le port ${port}`)
})