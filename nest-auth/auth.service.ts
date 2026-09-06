import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { InjectRepository } from "@nestjs/typeorm";
import * as bcrypt from "bcrypt";
import { Repository } from "typeorm";
import { User } from "./entities/user.entity";

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,
    private readonly jwt: JwtService
  ) {}

  async login(email: string, password: string) {
    const user = await this.users.findOne({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException("Invalid email or password");
    }

    const matches = await bcrypt.compare(password, user.passwordHash);
    if (!matches) {
      throw new UnauthorizedException("Invalid email or password");
    }

    return this.issueTokens(user);
  }

  async refresh(refreshToken: string) {
    try {
      const payload = await this.jwt.verifyAsync(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET || "change-me-refresh-secret",
      });
      const user = await this.users.findOne({ where: { id: payload.sub } });
      if (!user || !user.isActive) {
        throw new UnauthorizedException("Invalid refresh token");
      }
      return this.issueTokens(user);
    } catch {
      throw new UnauthorizedException("Invalid refresh token");
    }
  }

  async getProfile(userId: string) {
    const user = await this.users.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException();
    }
    return this.toPublicUser(user);
  }

  private async issueTokens(user: User) {
    const payload = { sub: user.id, email: user.email, role: user.role };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(payload, {
        secret: process.env.JWT_ACCESS_SECRET || "change-me-access-secret",
        expiresIn: process.env.JWT_ACCESS_EXPIRES || "15m",
      }),
      this.jwt.signAsync(payload, {
        secret: process.env.JWT_REFRESH_SECRET || "change-me-refresh-secret",
        expiresIn: process.env.JWT_REFRESH_EXPIRES || "7d",
      }),
    ]);

    return {
      accessToken,
      refreshToken,
      user: this.toPublicUser(user),
    };
  }

  private toPublicUser(user: User) {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    };
  }
}
