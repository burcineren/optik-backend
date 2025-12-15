import { PartialType } from "@nestjs/mapped-types";
import { Type } from "class-transformer";
import { CreateOrderDto, CreateFrameDto, CreatePrescriptionDto, CreateCustomerDto } from "./create-order.dto";
import { IsArray, IsOptional, ValidateNested, IsString } from "class-validator";

export class UpdateFrameDto extends PartialType(CreateFrameDto) { }

export class UpdateOrderDto extends PartialType(CreateOrderDto) {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreatePrescriptionDto)
    @IsOptional()
    prescriptions?: CreatePrescriptionDto[];

    @IsString()
    @IsOptional()
    customerName?: string;

    @IsString()
    @IsOptional()
    customerId?: string;

    @IsString()
    @IsOptional()
    fullName?: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateFrameDto)
    @IsOptional()
    frames?: CreateFrameDto[];

    @ValidateNested()
    @Type(() => CreateCustomerDto)
    @IsOptional()
    customer?: CreateCustomerDto;
}