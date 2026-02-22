import jwt from "jsonwebtoken";

/**
 * JWT Authentication Middleware.
 * Verifies the Bearer token and attaches decoded user to req.user.
 * @param {import('http').IncomingMessage} req
 * @param {import('http').ServerResponse} res
 * @returns {boolean} true if authenticated, false otherwise (response already sent)
 */
export const authenticate = (req, res) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        res.writeHead(401, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ message: "Authentication required. No token provided." }));
        return false;
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        return true;
    } catch (err) {
        res.writeHead(401, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ message: "Invalid or expired token." }));
        return false;
    }
};
