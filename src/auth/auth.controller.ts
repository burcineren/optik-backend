import {
  Controller,
  Post,
  Get,
  Body,
  UsePipes,
  ValidationPipe,
  Request,
  UseGuards,
  Res,
} from "@nestjs/common";
import { AuthService } from "./auth.service";
import { UsersService } from "../users/users.service";
import { RegisterDto } from "./dto/register.dto";
import * as bcrypt from "bcrypt";
import { AuthGuard } from "@nestjs/passport";
import type { Response } from "express";
import { LoginDto } from "./dto/login.dto";

@Controller("auth")
export class AuthController {
  constructor(
    private authService: AuthService,
    private usersService: UsersService,
  ) {}

  @Post("register")
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post("login")
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async login(@Body() loginDto: LoginDto) {
    const user = await this.authService.validateUser(
      loginDto.email,
      loginDto.password,
    );
    if (!user) throw new Error("Invalid credentials");
    return this.authService.login(user);
  }

  @Post("reset-password")
  async resetPassword(@Body() body: { email: string; newPassword: string }) {
    const hashedPassword = await bcrypt.hash(body.newPassword, 10);
    await this.usersService.updateUserPassword(body.email, hashedPassword);
    return { message: "Password updated successfully" };
  }
  @Post("logout")
  async logout(@Res({ passthrough: true }) response: Response) {
    response.clearCookie("authToken");
    return {
      success: true,
      message: "User logged out successfully",
    };
  }

  @UseGuards(AuthGuard("jwt"))
  @Get("me")
  async getProfile(@Request() req) {
    const user = req.user; // This is set by the JwtAuthGuard

    return {
      success: true,
      data: {
        user: {
          id: user.sub,
          email: user.email,
          fullName: user.name,
          role: user.role,
        },
      },
      message: "User profile retrieved successfully",
    };
  }
}
