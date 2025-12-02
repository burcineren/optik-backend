import { Injectable } from "@nestjs/common";
import { UsersService } from "../users/users.service";
import * as bcrypt from "bcrypt";
import { JwtService } from "@nestjs/jwt";
import { RegisterDto } from "./dto/register.dto";
import { Role } from "@prisma/client";

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, pass: string) {
    console.log("Validating user with email:", email);
    const user = await this.usersService.findByEmail(email);
    console.log("User found in DB:", user ? "Yes" : "No");

    if (!user) {
      console.log("User not found");
      return null;
    }

    const matched = await bcrypt.compare(pass, user.password);

    if (matched) {
      const { password, ...result } = user;
      return result;
    }

    return null;
  }

  async login(user: any) {
    const payload = {
      email: user.email,
      sub: user.id,
      role: user.role,
      name: user.name,
    };
    const accessToken = this.jwtService.sign(payload);
    return {
      success: true,
      accessToken,
      data: {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.name,
          role: user.role,
        },
      },
      message: "Login successful",
    };
  }

  async register(registerDto: RegisterDto) {
    const hashed = await bcrypt.hash(registerDto.password, 10);
    const user = await this.usersService.create({
      name: registerDto.name || "",
      email: registerDto.email,
      password: hashed,
      role: registerDto.role || Role.USER,
    });
    return this.login(user);
  }

  async logout(user: any) {
    const payload = {
      email: user.email,
      sub: user.id,
      role: user.role,
      name: user.name,
    };
    const accessToken = this.jwtService.sign(payload);
    return {
      success: true,
      accessToken,
      data: {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.name,
          role: user.role,
        },
      },
      message: "Logout successful",
    };
  }

  async getUserProfile(userId: string) {
    return this.usersService.findById(userId);
  }

  async getAllUsers() {
    return this.usersService.findAll();
  }
}
