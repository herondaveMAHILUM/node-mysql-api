import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import randomString from "randomstring";
import { Op } from "sequelize";
import config from "../config.json";
import db from "../_helpers/db";
import Role from "../_helpers/role";
import sendEmail from "../_helpers/send-email";
import { Account } from "./account.model";
import { RefreshToken } from "./refresh-token.model";

type RegisterParams = {
  title: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
};

type AuthenticateParams = { email: string; password: string };
type VerifyEmailParams = { token: string };
type ForgotPasswordParams = { email: string };
type ResetPasswordParams = { token: string; password: string; confirmPassword: string };
type UpdateParams = {
  title?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: string;
  password?: string;
  confirmPassword?: string;
};

const service = {
  register,
  verifyEmail,
  authenticate,
  refreshToken,
  revokeToken,
  ownsToken,
  forgotPassword,
  resetPassword,
  getAll,
  getById,
  update,
  delete: _delete
};

export default service;

async function register(params: RegisterParams, origin: string): Promise<void> {
  if (await db.Account.findOne({ where: { email: params.email } })) {
    throw `Email "${params.email}" is already registered`;
  }

  const isFirstAccount = (await db.Account.count()) === 0;
  const account = await db.Account.create({
    title: params.title,
    firstName: params.firstName,
    lastName: params.lastName,
    email: params.email,
    passwordHash: await bcrypt.hash(params.password, 10),
    role: isFirstAccount ? Role.Admin : Role.User,
    verificationToken: randomString.generate()
  });

  await sendVerificationEmail(account, origin);
}

async function verifyEmail({ token }: VerifyEmailParams): Promise<void> {
  const account = await db.Account.findOne({ where: { verificationToken: token } });
  if (!account) throw "Verification failed";

  account.verified = new Date();
  account.verificationToken = null;
  await account.save();
}

async function authenticate({ email, password }: AuthenticateParams, ipAddress: string) {
  const account = await db.Account.scope("withHash").findOne({ where: { email } });
  if (!account || !(await bcrypt.compare(password, account.passwordHash))) {
    throw "Email or password is incorrect";
  }
  if (!account.verified) {
    throw "Account is not verified";
  }

  const jwtToken = generateJwtToken(account);
  const refreshToken = await generateRefreshToken(account, ipAddress);
  return { ...basicDetails(account), jwtToken, refreshToken: refreshToken.token };
}

async function refreshToken(token: string | undefined, ipAddress: string) {
  const refreshToken = await getRefreshToken(token);
  const account = await db.Account.findByPk(refreshToken.accountId);
  if (!account) throw "Invalid token";

  const newRefreshToken = await generateRefreshToken(account, ipAddress);
  refreshToken.revoked = new Date();
  refreshToken.revokedByIp = ipAddress;
  refreshToken.replacedByToken = newRefreshToken.token;
  await refreshToken.save();

  const jwtToken = generateJwtToken(account);
  return { ...basicDetails(account), jwtToken, refreshToken: newRefreshToken.token };
}

async function revokeToken(token: string | undefined, ipAddress: string): Promise<void> {
  const refreshToken = await getRefreshToken(token);
  refreshToken.revoked = new Date();
  refreshToken.revokedByIp = ipAddress;
  await refreshToken.save();
}

async function ownsToken(accountId: number, token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const refreshToken = await db.RefreshToken.findOne({ where: { token, accountId } });
  return !!refreshToken;
}

async function forgotPassword({ email }: ForgotPasswordParams, origin: string): Promise<void> {
  const account = await db.Account.findOne({ where: { email } });
  if (!account) return;

  account.resetToken = randomString.generate();
  account.resetTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await account.save();
  await sendPasswordResetEmail(account, origin);
}

async function resetPassword({ token, password }: ResetPasswordParams): Promise<void> {
  const account = await db.Account.findOne({
    where: {
      resetToken: token,
      resetTokenExpires: { [Op.gt]: new Date() }
    }
  });
  if (!account) throw "Invalid token";

  account.passwordHash = await bcrypt.hash(password, 10);
  account.passwordReset = new Date();
  account.resetToken = null;
  account.resetTokenExpires = null;
  await account.save();
}

async function getAll() {
  return db.Account.findAll();
}

async function getById(id: number) {
  const account = await db.Account.findByPk(id);
  if (!account) throw "Account not found";
  return account;
}

async function update(id: number, params: UpdateParams) {
  const account = await getAccount(id);

  if (params.email && params.email !== account.email) {
    const emailExists = await db.Account.findOne({ where: { email: params.email } });
    if (emailExists) throw `Email "${params.email}" is already taken`;
  }

  const updateData: Record<string, unknown> = { ...params };
  if (params.password) {
    updateData.passwordHash = await bcrypt.hash(params.password, 10);
  }
  delete updateData.password;
  delete updateData.confirmPassword;

  Object.assign(account, updateData);
  await account.save();
  return basicDetails(account);
}

async function _delete(id: number): Promise<void> {
  const account = await getAccount(id);
  await account.destroy();
}

async function getAccount(id: number): Promise<Account> {
  const account = await db.Account.findByPk(id);
  if (!account) throw "Account not found";
  return account;
}

async function getRefreshToken(token: string | undefined): Promise<RefreshToken> {
  if (!token) throw "Invalid token";
  const refreshToken = await db.RefreshToken.findOne({ where: { token } });
  if (!refreshToken || refreshToken.revoked || new Date() > refreshToken.expires) {
    throw "Invalid token";
  }
  return refreshToken;
}

function generateJwtToken(account: Account): string {
  return jwt.sign({ id: account.id }, config.secret, { expiresIn: "15m" });
}

async function generateRefreshToken(account: Account, ipAddress: string): Promise<RefreshToken> {
  const refreshToken = await db.RefreshToken.create({
    accountId: account.id,
    token: randomString.generate(),
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    createdByIp: ipAddress
  });
  return refreshToken;
}

function basicDetails(account: Account) {
  const { id, title, firstName, lastName, email, role, createdAt, updatedAt } = account;
  return { id, title, firstName, lastName, email, role, createdAt, updatedAt };
}

async function sendVerificationEmail(account: Account, origin: string): Promise<void> {
  const verifyUrl = `${origin}/accounts/verify-email?token=${account.verificationToken}`;
  const message = `<p>Please click the below link to verify your email address:</p><p><a href="${verifyUrl}">${verifyUrl}</a></p>`;

  await sendEmail({
    to: account.email,
    subject: "Sign-up Verification API - Verify Email",
    html: `<h4>Verify Email</h4>${message}`
  });
}

async function sendPasswordResetEmail(account: Account, origin: string): Promise<void> {
  const resetUrl = `${origin}/accounts/reset-password?token=${account.resetToken}`;
  const message = `<p>Please click the below link to reset your password:</p><p><a href="${resetUrl}">${resetUrl}</a></p>`;

  await sendEmail({
    to: account.email,
    subject: "Sign-up Verification API - Reset Password",
    html: `<h4>Reset Password Email</h4>${message}`
  });
}
