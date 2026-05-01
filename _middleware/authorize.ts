import { expressjwt as jwt } from "express-jwt";
import config from "../config.json";
import db from "../_helpers/db";
import { RequestHandler } from "express";

const { secret } = config;

export default function authorize(roles: any = []) {
  if (typeof roles === "string") {
    roles = [roles];
  }

  const jwtMiddleware = jwt({ secret, algorithms: ["HS256"], requestProperty: "user" });

  const authMiddleware: RequestHandler = async (req: any, res: any, next: any) => {
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

      const account = await db.Account.findByPk(req.user.id);

      console.log("account found:", account ? { id: account.id, role: account.role, verified: account.verified } : null);
      console.log("roles check:", roles.length, roles.includes(account?.role));

      if (!account || (roles.length && !roles.includes(account.role))) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      req.user.role = account.role;
      const refreshTokens = await account.getRefreshTokens();
      req.user.ownsToken = (token: any) => !!refreshTokens.find((x: any) => x.token === token);
      next();
    } catch (err) {
      next(err);
    }
  };

  return [jwtMiddleware, authMiddleware];
}
