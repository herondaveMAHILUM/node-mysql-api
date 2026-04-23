import { Request, Response, NextFunction } from "express";
import { expressjwt } from "express-jwt";
import config from "../config.json";
import db from "../_helpers/db";
import Role, { RoleType } from "../_helpers/role";

export function authorize(roles: RoleType[] | RoleType = []) {
  const roleList = typeof roles === "string" ? [roles] : roles;

  return [
    expressjwt({ secret: config.secret, algorithms: ["HS256"] }),
    async (req: Request, res: Response, next: NextFunction) => {
      const authReq = req as Request & { auth?: { id: number } };
      if (!authReq.auth?.id) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      const account = await db.Account.findByPk(authReq.auth.id);
      if (!account) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      if (roleList.length && !roleList.includes(account.role)) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      req.user = {
        id: account.id,
        role: account.role
      };

      next();
    }
  ];
}

export { Role };
