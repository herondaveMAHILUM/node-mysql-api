import express, { NextFunction, Request, Response } from "express";
import Joi from "joi";
import accountService from "./account.service";
import { authorize } from "../_middleware/authorize";
import { validateRequest } from "../_middleware/validate-request";
import Role from "../_helpers/role";

const router = express.Router();

router.post("/register", registerSchema, register);
router.post("/verify-email", verifyEmailSchema, verifyEmail);
router.post("/authenticate", authenticateSchema, authenticate);
router.post("/refresh-token", refreshToken);
router.post("/revoke-token", authorize(), revokeTokenSchema, revokeToken);
router.post("/forgot-password", forgotPasswordSchema, forgotPassword);
router.post("/reset-password", resetPasswordSchema, resetPassword);

router.get("/", authorize(Role.Admin), getAll);
router.get("/:id", authorize(), getById);
router.put("/:id", authorize(), updateSchema, update);
router.delete("/:id", authorize(), _delete);

export default router;

function registerSchema(req: Request, _res: Response, next: NextFunction): void {
  const schema = Joi.object({
    title: Joi.string().required(),
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    confirmPassword: Joi.valid(Joi.ref("password")).required()
  });
  validateRequest(req, next, schema);
}

function verifyEmailSchema(req: Request, _res: Response, next: NextFunction): void {
  const schema = Joi.object({ token: Joi.string().required() });
  validateRequest(req, next, schema);
}

function authenticateSchema(req: Request, _res: Response, next: NextFunction): void {
  const schema = Joi.object({
    email: Joi.string().required(),
    password: Joi.string().required()
  });
  validateRequest(req, next, schema);
}

function revokeTokenSchema(req: Request, _res: Response, next: NextFunction): void {
  const schema = Joi.object({ token: Joi.string().empty("") });
  validateRequest(req, next, schema);
}

function forgotPasswordSchema(req: Request, _res: Response, next: NextFunction): void {
  const schema = Joi.object({ email: Joi.string().email().required() });
  validateRequest(req, next, schema);
}

function resetPasswordSchema(req: Request, _res: Response, next: NextFunction): void {
  const schema = Joi.object({
    token: Joi.string().required(),
    password: Joi.string().min(6).required(),
    confirmPassword: Joi.valid(Joi.ref("password")).required()
  });
  validateRequest(req, next, schema);
}

function updateSchema(req: Request, _res: Response, next: NextFunction): void {
  const schema = Joi.object({
    title: Joi.string().empty(""),
    firstName: Joi.string().empty(""),
    lastName: Joi.string().empty(""),
    email: Joi.string().email().empty(""),
    role: Joi.string().valid(Role.Admin, Role.User),
    password: Joi.string().min(6).empty(""),
    confirmPassword: Joi.valid(Joi.ref("password")).empty("")
  }).with("password", "confirmPassword");
  validateRequest(req, next, schema);
}

async function register(req: Request, res: Response, next: NextFunction) {
  try {
    await accountService.register(req.body, req.get("origin") || "http://localhost:4000");
    res.json({ message: "Registration successful, please check your email for verification instructions" });
  } catch (err) {
    next(err);
  }
}

async function verifyEmail(req: Request, res: Response, next: NextFunction) {
  try {
    await accountService.verifyEmail(req.body);
    res.json({ message: "Verification successful, you can now login" });
  } catch (err) {
    next(err);
  }
}

async function authenticate(req: Request, res: Response, next: NextFunction) {
  try {
    const response = await accountService.authenticate(req.body, req.ip);
    setTokenCookie(res, response.refreshToken);
    res.json(response);
  } catch (err) {
    next(err);
  }
}

async function refreshToken(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.refreshToken;
    const response = await accountService.refreshToken(token, req.ip);
    setTokenCookie(res, response.refreshToken);
    res.json(response);
  } catch (err) {
    next(err);
  }
}

async function revokeToken(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.body.token || req.cookies?.refreshToken;
    if (!(await accountService.ownsToken(req.user!.id, token)) && req.user?.role !== Role.Admin) {
      throw "Unauthorized";
    }
    await accountService.revokeToken(token, req.ip);
    res.json({ message: "Token revoked" });
  } catch (err) {
    next(err);
  }
}

async function forgotPassword(req: Request, res: Response, next: NextFunction) {
  try {
    await accountService.forgotPassword(req.body, req.get("origin") || "http://localhost:4000");
    res.json({ message: "Please check your email for password reset instructions" });
  } catch (err) {
    next(err);
  }
}

async function resetPassword(req: Request, res: Response, next: NextFunction) {
  try {
    await accountService.resetPassword(req.body);
    res.json({ message: "Password reset successful, you can now login" });
  } catch (err) {
    next(err);
  }
}

async function getAll(_req: Request, res: Response, next: NextFunction) {
  try {
    const accounts = await accountService.getAll();
    res.json(accounts);
  } catch (err) {
    next(err);
  }
}

async function getById(req: Request, res: Response, next: NextFunction) {
  try {
    if (Number(req.params.id) !== req.user?.id && req.user?.role !== Role.Admin) {
      throw "Unauthorized";
    }
    const account = await accountService.getById(Number(req.params.id));
    res.json(account);
  } catch (err) {
    next(err);
  }
}

async function update(req: Request, res: Response, next: NextFunction) {
  try {
    if (Number(req.params.id) !== req.user?.id && req.user?.role !== Role.Admin) {
      throw "Unauthorized";
    }
    if (req.user?.role !== Role.Admin) {
      delete req.body.role;
    }
    const account = await accountService.update(Number(req.params.id), req.body);
    res.json(account);
  } catch (err) {
    next(err);
  }
}

async function _delete(req: Request, res: Response, next: NextFunction) {
  try {
    if (Number(req.params.id) !== req.user?.id && req.user?.role !== Role.Admin) {
      throw "Unauthorized";
    }
    await accountService.delete(Number(req.params.id));
    res.json({ message: "Account deleted successfully" });
  } catch (err) {
    next(err);
  }
}

function setTokenCookie(res: Response, token: string): void {
  const cookieOptions = {
    httpOnly: true,
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  };
  res.cookie("refreshToken", token, cookieOptions);
}
