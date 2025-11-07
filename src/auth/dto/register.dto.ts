import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from "class-validator";
import { Role } from "@prisma/client";

export class RegisterDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsEnum(Role, { message: "Invalid role" })
  @IsOptional()
  role?: Role;
}

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}
