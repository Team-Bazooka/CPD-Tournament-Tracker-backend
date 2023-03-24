import { Module } from "@nestjs/common";
import { PrismaService } from "src/utils/prisma.service";
import { MemberController } from "./member.controller";


@Module({
    imports: [],
    controllers: [MemberController],
    providers: [PrismaService]
})

export class MemberModule {}