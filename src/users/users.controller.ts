import {
  Controller,
  Get,
  Param,
  UseGuards,
  Req,
  Post,
  Body,
  BadRequestException,
  ConflictException,
  ParseUUIDPipe,
} from "@nestjs/common";
import { UsersService } from "./users.service";
import { AuthGuard } from "@nestjs/passport";
import { CreateUserDto } from "./dto/create-user.dto";
import { User } from "@prisma/client";

@Controller("users")
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  // @UseGuards(AuthGuard("jwt"))
  async findAll() {
    return this.usersService.findAll();
  }

  @Get("me")
  @UseGuards(AuthGuard("jwt"))
  async getProfile(@Req() req: any) {
    return this.usersService.findById(req.user.userId);
  }

  @Get(":id")
  @UseGuards(AuthGuard("jwt"))
  async findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.usersService.findById(id);
  }

  @Post()
  async create(@Body() createUserDto: CreateUserDto) {
    try {
      return await this.usersService.create(createUserDto);
    } catch (error) {
      if (error.code === "P2002") {
        throw new ConflictException("Email already exists");
      }
      throw new BadRequestException("Failed to create user");
    }
  }
}
