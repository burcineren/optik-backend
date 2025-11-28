
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsEnum,
  IsArray,
  ValidateNested,
  IsDateString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { OrderStatus, PrescriptionType, EyeSide } from '@prisma/client';

// This DTO matches the nested structure for distance and near measurements
class EyeMeasurementDto {
  @IsString()
  @IsOptional()
  sign?: string;

  @IsNumber()
  @IsOptional()
  sph?: number;

  @IsNumber()
  @IsOptional()
  cyl?: number;

  @IsNumber()
  @IsOptional()
  ax?: number;
}

class CreateRelativeDto {
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsString()
  @IsNotEmpty()
  tcIdentityNumber: string;
}

class CreateCustomerDto {
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsString()
  @IsNotEmpty()
  tcIdentityNumber: string;

  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => CreateRelativeDto)
  relative?: CreateRelativeDto;
}

class CreateLensDto {
  @IsString()
  @IsOptional()
  lensType?: string;

  @IsString()
  @IsOptional()
  material?: string;

  @IsString()
  @IsOptional()
  coating?: string;

  @IsString()
  @IsOptional()
  lensIndex?: string;
}

class CreatePrescriptionDto {
  @IsEnum(EyeSide)
  @IsNotEmpty()
  eyeSide: EyeSide;

  @ValidateNested()
  @Type(() => EyeMeasurementDto)
  @IsOptional()
  distance?: EyeMeasurementDto;

  @ValidateNested()
  @Type(() => EyeMeasurementDto)
  @IsOptional()
  near?: EyeMeasurementDto;

  @IsNumber()
  @IsOptional()
  addition?: number;

  @IsNumber()
  @IsOptional()
  pd?: number;

  @IsNumber()
  @IsOptional()
  height?: number;

  @IsNumber()
  @IsOptional()
  diameter?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateLensDto)
  @IsOptional()
  lenses?: CreateLensDto[];
}

class CreateFrameDto {
  @IsString()
  @IsOptional()
  brand?: string;

  @IsString()
  @IsOptional()
  model?: string;

  @IsString()
  @IsOptional()
  color?: string;

  @IsString()
  @IsOptional()
  type?: string;
}

export class CreateOrderDto {
  // Customer can be an existing ID or a new customer object
  @IsOptional()
  @IsString()
  customerId?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => CreateCustomerDto)
  customer?: CreateCustomerDto;

  @IsDateString()
  @IsOptional()
  orderDate?: Date;

  @IsDateString()
  @IsOptional()
  deliveryDate?: Date;

  @IsNumber()
  @Min(0)
  totalAmount: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  sgkAmount?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  remainingAmount?: number;

  @IsEnum(OrderStatus)
  @IsOptional()
  status?: OrderStatus;

  @IsEnum(PrescriptionType)
  @IsOptional()
  prescriptionType?: PrescriptionType;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateFrameDto)
  frames: CreateFrameDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePrescriptionDto)
  prescriptions: CreatePrescriptionDto[];
}
