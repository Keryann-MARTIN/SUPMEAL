const jwt = require("jsonwebtoken")

function auth(req, res, next) {
    const authorization = req.headers.authorization

    if (!authorization || !authorization.startsWith("Bearer ")) {
        return res.status(401).json({
            message: "Authentification requise"
        })
    }

    const token = authorization.split(" ")[1]

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET)

        req.userId = payload.userId

        next()
    } catch {
        res.status(401).json({
            message: "Token invalide ou expiré"
        })
    }
}

module.exports = auth