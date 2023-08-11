// Декораторы для настройки валидации
import { IsEmail, Length } from 'class-validator';

// User - описываем какие поля должна содержать таблица
export class CreateUserDto {
  @Length(3)
  fullName: string;

  @IsEmail(undefined, { message: 'Неверная почта' })
  email: string;
  // min:6 , max:32
  @Length(6, 32, { message: 'Пароль должен содержать минимум 6 символов' })
  password?: string;
}
