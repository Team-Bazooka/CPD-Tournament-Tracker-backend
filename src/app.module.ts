import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MemberController } from './user/member.controller';
import { MemberModule } from './user/member.module';
import { AdminModule } from './admin/admin.module';
import { PrismaService } from './utils/prisma.service';
import { AdminController } from './admin/admin.controller';

@Module({
  imports: [MemberModule, AdminModule],
  controllers: [AppController, MemberController, AdminController],
  providers: [AppService, PrismaService],
})
export class AppModule {}
