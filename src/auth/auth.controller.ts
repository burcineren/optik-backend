import {
  Controller,
  Post,
  Get,
  Body,
  UsePipes,
  ValidationPipe,
  Request,
  UseGuards,
  Query,
} from "@nestjs/common";
import { AuthService } from "./auth.service";
import { RegisterDto, LoginDto } from "./dto/register.dto";
import { JwtAuthGuard } from "./jwt-auth.guard";
import { AuthGuard } from "@nestjs/passport";

@Controller("auth")
export class AuthController {
  constructor(private authService: AuthService) { }

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
