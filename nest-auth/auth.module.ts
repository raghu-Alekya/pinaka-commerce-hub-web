import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { User } from "./entities/user.entity";
import { JwtAuthGuard } from "./jwt-auth.guard";

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    JwtModule.register({
      secret: process.env.JWT_ACCESS_SECRET || "change-me-access-secret",
      signOptions: { expiresIn: process.env.JWT_ACCESS_EXPIRES || "15m" },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtAuthGuard],
  exports: [AuthService, JwtAuthGuard],
})
export class AuthModule {}
