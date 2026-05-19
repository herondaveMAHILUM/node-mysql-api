"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = authorize;
const express_jwt_1 = require("express-jwt");
const db_1 = require("../_helpers/db");
const secret = process.env.JWT_SECRET || "replace-with-a-long-random-secret";
function authorize(roles = []) {
    if (typeof roles === "string") {
        roles = [roles];
    }
    return [
        (0, express_jwt_1.expressjwt)({ secret, algorithms: ["HS256"] }),
        async (req, res, next) => {
            const account = await db_1.default.Account.findByPk(req.user.id);
            if (!account || (roles.length && !roles.includes(account.role))) {
                return res.status(401).json({ message: "Unauthorized" });
            }
            req.user.role = account.role;
            const refreshTokens = await account.getRefreshTokens();
            req.user.ownsToken = (token) => !!refreshTokens.find((x) => x.token === token);
            next();
        }
    ];
}
