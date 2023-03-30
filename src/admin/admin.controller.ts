import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { PrismaService } from 'src/utils/prisma.service';

@Controller('api/admin')
export class AdminController {

  constructor(private readonly prismaService: PrismaService) {}

  @Post('/login')
  async login(@Body() loginData: { identifier: string; password: string }) {

  }

  @Get('/members')
  async getMembers(
    @Query('take') take?: number,
    @Query('skip') skip?: number,
    @Query('searchString') searchString?: string,
    @Query('orderBy') orderBy?: 'asc' | 'desc'
  ){
    const or = searchString ? {
        OR: [
          { fname : { contains: searchString } },
          { lname : { contains: searchString } },
          { student_id : { contains: searchString }},
          { email : { contains: searchString }},
          { tg_username : { contains: searchString }}
        ],
      }: {}

    return await this.prismaService.member.findMany({
        where: {
            ...or
        },
        take: Number(take) || undefined,
        skip: Number(skip) || undefined  
    })
  }

  @Get('/teams')
  async getTeams(
    @Query('take') take?: number,
    @Query('skip') skip?: number,
    @Query('searchString') searchString?: string,
    @Query('orderBy') orderBy?: 'asc' | 'desc'
  ){
    const or = searchString ? {
        OR: [
          { name : { contains: searchString } }, 
        ],
      }: {}

    return await this.prismaService.team.findMany({
        where: {
            ...or
        },
        take: Number(take) || undefined,
        skip: Number(skip) || undefined  
    })
  }

  @Get('/tournaments')
  async getTournaments(
    @Query('take') take?: number,
    @Query('skip') skip?: number,
    @Query('searchString') searchString?: string,
    @Query('orderBy') orderBy?: 'asc' | 'desc'
  ){
    const or = searchString ? {
        OR: [
          { name : { contains: searchString } },
          { type : { contains: searchString } },
        ],
      }: {}

    return await this.prismaService.tournament.findMany({
        where: {
            ...or
        },
        take: Number(take) || undefined,
        skip: Number(skip) || undefined  
    })
  }

}
