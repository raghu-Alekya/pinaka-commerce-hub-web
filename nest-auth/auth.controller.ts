import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from "@nestjs/common";
import type { Request, Response } from "express";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import { RefreshDto } from "./dto/refresh.dto";
import { JwtAuthGuard } from "./jwt-auth.guard";

const REFRESH_COOKIE = "pch_refresh";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("login")
  async login(
    @Body() body: LoginDto,
    @Res({ passthrough: true }) response: Response
  ) {
    const result = await this.authService.login(body.email, body.password);
    this.setRefreshCookie(response, result.refreshToken);
    return result;
  }

  @Post("refresh")
  async refresh(
    @Body() body: RefreshDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response
  ) {
    const token = body.refreshToken || request.cookies?.[REFRESH_COOKIE];
    if (!token) {
      throw new UnauthorizedException("Refresh token is missing");
    }

    const result = await this.authService.refresh(token);
    this.setRefreshCookie(response, result.refreshToken);
    return result;
  }

  @Post("logout")
  async logout(@Res({ passthrough: true }) response: Response) {
    response.clearCookie(REFRESH_COOKIE, {
      httpOnly: true,
      path: "/",
      sameSite: "lax",
    });
    return { success: true };
  }

  @UseGuards(JwtAuthGuard)
  @Get("me")
  me(@Req() request: Request & { user: unknown }) {
    return request.user;
  }

  private setRefreshCookie(response: Response, refreshToken: string) {
    response.cookie(REFRESH_COOKIE, refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }
}
