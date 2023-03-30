import { Module } from "@nestjs/common";
import { PrismaService } from "src/utils/prisma.service";
import { AdminController } from "./admin.controller";


@Module({
    imports: [],
    controllers: [AdminController],
    providers: [PrismaService]
})

export class AdminModule {}