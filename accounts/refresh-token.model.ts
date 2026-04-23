import { DataTypes, Model, Optional, Sequelize } from "sequelize";

export interface RefreshTokenAttributes {
  id: number;
  token: string;
  expires: Date;
  createdByIp: string;
  revoked?: Date | null;
  revokedByIp?: string | null;
  replacedByToken?: string | null;
  accountId: number;
  isExpired?: boolean;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

type RefreshTokenCreation = Optional<RefreshTokenAttributes, "id" | "revoked" | "revokedByIp" | "replacedByToken">;

export class RefreshToken extends Model<RefreshTokenAttributes, RefreshTokenCreation> implements RefreshTokenAttributes {
  public id!: number;
  public token!: string;
  public expires!: Date;
  public createdByIp!: string;
  public revoked!: Date | null;
  public revokedByIp!: string | null;
  public replacedByToken!: string | null;
  public accountId!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export default function refreshTokenModel(sequelize: Sequelize): typeof RefreshToken {
  RefreshToken.init(
    {
      id: { autoIncrement: true, primaryKey: true, type: DataTypes.INTEGER.UNSIGNED },
      token: { type: DataTypes.STRING, allowNull: false },
      expires: { type: DataTypes.DATE, allowNull: false },
      createdByIp: { type: DataTypes.STRING, allowNull: false },
      revoked: { type: DataTypes.DATE, allowNull: true },
      revokedByIp: { type: DataTypes.STRING, allowNull: true },
      replacedByToken: { type: DataTypes.STRING, allowNull: true },
      accountId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      isExpired: {
        type: DataTypes.VIRTUAL,
        get(this: RefreshToken) {
          return Date.now() >= this.expires.getTime();
        }
      },
      isActive: {
        type: DataTypes.VIRTUAL,
        get(this: RefreshToken) {
          return !(this as unknown as { isExpired: boolean }).isExpired && !this.revoked;
        }
      }
    },
    {
      sequelize,
      modelName: "RefreshToken"
    }
  );

  return RefreshToken;
}
