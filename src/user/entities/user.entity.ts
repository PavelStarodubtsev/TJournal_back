import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';
import { IsEmail } from 'class-validator';

// описываем нашу таблицу, какие поля она содержит
@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  fullName: string;

  @Column()
  @IsEmail()
  email: string;

  @Column({ nullable: true })
  password?: string;
}
