import { IsEmail, IsString, Length, MaxLength, MinLength } from 'class-validator';

export class SignupDto {
  @IsEmail({}, { message: '올바른 이메일 형식이 아닙니다.' })
  email!: string;

  @IsString()
  @MinLength(8, { message: '비밀번호는 8자 이상이어야 합니다.' })
  @MaxLength(72, { message: '비밀번호는 72자 이하여야 합니다.' })
  password!: string;

  @IsString()
  @Length(1, 12, { message: '닉네임은 1~12자로 입력해 주세요.' })
  nickname!: string;
}

export class LoginDto {
  @IsEmail({}, { message: '올바른 이메일 형식이 아닙니다.' })
  email!: string;

  @IsString({ message: '비밀번호를 입력해 주세요.' })
  @MaxLength(72)
  password!: string;
}
