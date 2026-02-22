/**
 * Role-based Authorization Middleware.
 * Must be called AFTER authenticate middleware.
 * Checks if the authenticated user has ADMIN role.
 * @param {import('http').IncomingMessage} req
 * @param {import('http').ServerResponse} res
 * @returns {boolean} true if authorized, false otherwise (response already sent)
 */
export const authorizeAdmin = (req, res) => {
    if (!req.user || req.user.role !== "ADMIN") {
        res.writeHead(403, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ message: "Access denied. Admin privileges required." }));
        return false;
    }
    return true;
};
