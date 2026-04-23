import { DataTypes, Model, Optional, Sequelize } from "sequelize";
import Role, { RoleType } from "../_helpers/role";

export interface AccountAttributes {
  id: number;
  title: string;
  firstName: string;
  lastName: string;
  email: string;
  passwordHash: string;
  role: RoleType;
  verificationToken?: string | null;
  verified?: Date | null;
  resetToken?: string | null;
  resetTokenExpires?: Date | null;
  passwordReset?: Date | null;
  fullName?: string;
  isVerified?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

type AccountCreation = Optional<AccountAttributes, "id" | "role" | "verificationToken" | "verified" | "resetToken" | "resetTokenExpires" | "passwordReset">;

export class Account extends Model<AccountAttributes, AccountCreation> implements AccountAttributes {
  public id!: number;
  public title!: string;
  public firstName!: string;
  public lastName!: string;
  public email!: string;
  public passwordHash!: string;
  public role!: RoleType;
  public verificationToken!: string | null;
  public verified!: Date | null;
  public resetToken!: string | null;
  public resetTokenExpires!: Date | null;
  public passwordReset!: Date | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export default function accountModel(sequelize: Sequelize): typeof Account {
  Account.init(
    {
      id: { autoIncrement: true, primaryKey: true, type: DataTypes.INTEGER.UNSIGNED },
      title: { type: DataTypes.STRING, allowNull: false },
      firstName: { type: DataTypes.STRING, allowNull: false },
      lastName: { type: DataTypes.STRING, allowNull: false },
      email: { type: DataTypes.STRING, allowNull: false, unique: true },
      passwordHash: { type: DataTypes.STRING, allowNull: false },
      role: { type: DataTypes.ENUM(Role.Admin, Role.User), allowNull: false, defaultValue: Role.User },
      verificationToken: { type: DataTypes.STRING, allowNull: true },
      verified: { type: DataTypes.DATE, allowNull: true },
      resetToken: { type: DataTypes.STRING, allowNull: true },
      resetTokenExpires: { type: DataTypes.DATE, allowNull: true },
      passwordReset: { type: DataTypes.DATE, allowNull: true },
      fullName: {
        type: DataTypes.VIRTUAL,
        get(this: Account) {
          return `${this.title} ${this.firstName} ${this.lastName}`;
        }
      },
      isVerified: {
        type: DataTypes.VIRTUAL,
        get(this: Account) {
          return !!(this.verified || this.passwordReset);
        }
      }
    },
    {
      defaultScope: {
        attributes: { exclude: ["passwordHash"] }
      },
      scopes: {
        withHash: { attributes: {} }
      },
      sequelize,
      modelName: "Account"
    }
  );

  return Account;
}
