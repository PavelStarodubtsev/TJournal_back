import { IsEmail, Length } from 'class-validator';

export class LoginUserDto {
  @IsEmail(undefined, { message: 'Неверная почта' })
  email: string;

  // min:6 , max:32
  @Length(6, 32, { message: 'Пароль должен минимум 6 символов' })
  password?: string;
}
