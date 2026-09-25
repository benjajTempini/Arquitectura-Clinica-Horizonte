import { ApiProperty } from '@nestjs/swagger';

export class AuthUserDto {
  @ApiProperty({ example: 'b819f71c-43f1-4db8-b593-3d0cf3a9486c' })
  id: string;

  @ApiProperty({ example: 'admin@clinicahorizonte.cl' })
  email: string;

  @ApiProperty({ example: 'Administrador' })
  firstName: string;

  @ApiProperty({ example: 'Sistema' })
  lastName: string;

  @ApiProperty({ example: ['ADMIN'], isArray: true })
  roles: string[];
}

export class AuthResponseDto {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...', description: 'JWT Access Token' })
  accessToken: string;

  @ApiProperty({ example: 'Bearer' })
  tokenType: string;

  @ApiProperty({ example: 28800, description: 'Expiración en segundos' })
  expiresIn: number;

  @ApiProperty({ type: AuthUserDto })
  user: AuthUserDto;
}
