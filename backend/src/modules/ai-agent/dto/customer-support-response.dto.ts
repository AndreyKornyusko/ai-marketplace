import { ApiProperty } from '@nestjs/swagger';

export class CustomerSupportResponseDto {
  @ApiProperty()
  conversationId!: string;

  @ApiProperty()
  reply!: string;
}
