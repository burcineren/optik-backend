import {
  IsString,
  IsEmail,
  IsOptional,
  IsBoolean,
  Length,
} from "class-validator";

export class CreateCustomerDto {
  @IsString()
  @Length(11, 11)
  tcIdentityNumber: string;

  @IsString()
  fullName: string;

  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
