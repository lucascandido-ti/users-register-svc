import { IsEnum, IsString } from "class-validator";
import { UserType } from "../utils";

export class SignUpDTO {
  @IsString()
  email: string;

  @IsString()
  password: string;

  @IsString()
  name: string;

  @IsString()
  phone: string;

  @IsString()
  rg: string;

  @IsEnum(UserType)
  userType: UserType;

  @IsString()
  cnh: string;

  @IsString()
  address: string;
}
