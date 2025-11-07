import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from "class-validator";
import { StockMovementType, StockMovementStatus } from "@prisma/client";

export class CreateStockDto {
  @IsEnum(StockMovementType)
  @IsNotEmpty()
  movementType: StockMovementType;

  @IsEnum(StockMovementStatus)
  @IsOptional()
  status?: StockMovementStatus;

  @IsNumber()
  @IsNotEmpty()
  quantity: number;

  @IsNumber()
  @IsNotEmpty()
  unitPrice: number;

  @IsNumber()
  @IsOptional()
  totalPrice?: number;

  @IsString()
  @IsOptional()
  referenceNo?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsString()
  @IsUUID()
  @IsNotEmpty()
  variantId: string;

  @IsString()
  @IsUUID()
  @IsOptional()
  userId?: string;

  @IsString()
  @IsUUID()
  @IsOptional()
  orderId?: string;

  @IsOptional()
  movementDate?: Date;
}
