import { IsEmail, IsNotEmpty, IsString } from "class-validator";

export class SignInDTO {
  @IsString()
  @IsNotEmpty()
  @IsEmail()
  username: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}
