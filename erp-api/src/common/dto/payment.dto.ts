import { Type } from "class-transformer";
import { IsInt, IsPositive, IsString, IsNotEmpty, IsOptional, MaxLength, IsDateString } from "class-validator";

/**
 * Production hardening — validated DTO for recording payments and refunds. Money
 * is integer minor units (poisha) and MUST be a positive integer — this closes
 * the NaN/negative/overflow gap where amounts arrived as unvalidated `any`.
 */
export class RecordPaymentDto {
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  amount!: number; // minor units (poisha)

  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  accountId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  invoiceId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  customerId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  method?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  reference?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;

  @IsOptional()
  @IsDateString()
  receivedAt?: string;
}
