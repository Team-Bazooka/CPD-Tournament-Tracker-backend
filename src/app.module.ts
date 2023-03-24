import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MemberController } from './user/member.controller';
import { MemberModule } from './user/member.module';

@Module({
  imports: [MemberModule],
  controllers: [AppController, MemberController],
  providers: [AppService],
})
export class AppModule {}
