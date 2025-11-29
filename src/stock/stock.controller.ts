import {
  Controller,
  Get,
  Body,
  Post,
} from "@nestjs/common";
import { StockService } from "./stock.service";
import { CreateStockDto } from "./dto/create.stock.dto";

@Controller("stock")
export class StockController {
  constructor(private stockService: StockService) { }

  @Get()
  async findAll() {
    return this.stockService.findAll();
  }

  @Post()
  async create(@Body() createStockDto: CreateStockDto) {
    return this.stockService.create(createStockDto);
  }
}
