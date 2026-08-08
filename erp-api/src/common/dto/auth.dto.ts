import { IsEmail, IsString, IsNotEmpty, IsOptional, MinLength, MaxLength } from "class-validator";

/**
 * Production hardening — validated DTOs for every auth endpoint (staff + agent +
 * customer + corporate portals). The global ValidationPipe (whitelist+transform)
 * only enforces shape when the @Body() is typed as a DTO class — these replace
 * the untyped `@Body() b: any/{...}` on credential-bearing endpoints.
 */
export class LoginDto {
  @IsEmail()
  @MaxLength(200)
  email!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  password!: string;
}

export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty()
  currentPassword!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(200)
  newPassword!: string;
}

/** forgot-password / otp request — email only. */
export class EmailDto {
  @IsEmail()
  @MaxLength(200)
  email!: string;
}

export class ResetPasswordDto {
  @IsEmail()
  @MaxLength(200)
  email!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  code!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(200)
  newPassword!: string;
}

/** otp/verify and verify-email — email + code. */
export class EmailCodeDto {
  @IsEmail()
  @MaxLength(200)
  email!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  code!: string;
}

/** HF3 — customer portal self-registration (was @Body() any). */
export class RegisterDto {
  @IsEmail()
  @MaxLength(200)
  email!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(200)
  password!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  fullName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;
}
