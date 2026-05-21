"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = authorize;
const express_jwt_1 = require("express-jwt");
const db_1 = __importDefault(require("../_helpers/db"));
const secret = process.env.JWT_SECRET || "replace-with-a-long-random-secret";
function authorize(roles = []) {
    if (typeof roles === "string") {
        roles = [roles];
    }
    const jwtMiddleware = (0, express_jwt_1.expressjwt)({ secret, algorithms: ["HS256"], requestProperty: "user" });
    const authMiddleware = async (req, res, next) => {
        try {
            // support both req.user (express-jwt v6) and req.auth (express-jwt v7+)
            const payload = req.user ?? req.auth;
            if (!payload) {
                return res.status(401).json({ message: "Unauthorized" });
            }
            // normalize to req.user
            req.user = payload;
            console.log("JWT payload:", payload);
            console.log("roles required:", roles);
            const account = await db_1.default.Account.findByPk(req.user.id);
            console.log("account found:", account ? { id: account.id, role: account.role, verified: account.verified } : null);
            console.log("roles check:", roles.length, roles.includes(account?.role));
            if (!account || (roles.length && !roles.includes(account.role))) {
                return res.status(401).json({ message: "Unauthorized" });
            }
            req.user.role = account.role;
            const refreshTokens = await account.getRefreshTokens();
            req.user.ownsToken = (token) => !!refreshTokens.find((x) => x.token === token);
            next();
        }
        catch (err) {
            next(err);
        }
    };
    return [jwtMiddleware, authMiddleware];
}
