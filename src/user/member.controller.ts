import {
  Body,
  Controller,
  Get,
  Post,
  HttpException,
  HttpStatus,
  Param,
  Put,
  Query,
} from '@nestjs/common';
import { PrismaService } from 'src/utils/prisma.service';
import { IMember } from 'src/utils/types';
import {
  IncompleteInputException,
  InvalidCredentialsException,
  TeamExistsException,
  TeamNotFoundException,
  UserExistsException,
  UserNotFoundExceptions,
} from 'src/utils/exceptions';
import { invitation_status } from '@prisma/client';
import * as jwt from 'jsonwebtoken';
import * as bcrypt from 'bcryptjs';

@Controller('api/member')
export class MemberController {
  constructor(private readonly prismaService: PrismaService) {}

  @Post('/signup')
  async signup(@Body() memberData: IMember) {
    const {
      fname,
      lname,
      student_id,
      kattis_acct_link,
      tg_username,
      email,
      password,
    } = memberData;
    if (
      !fname ||
      !lname ||
      !student_id ||
      !kattis_acct_link ||
      !tg_username ||
      !email ||
      !password
    ) {
      throw new IncompleteInputException();
    }

    let salt: string = await bcrypt.genSalt(10);
    let pwd: string = await bcrypt.hash(password, salt);

    try {
      const n = await this.prismaService.member.count({
        where: {
          OR: [
            {
              email,
            },
            {
              student_id,
            },
            {
              kattis_acct_link,
            },
            {
              tg_username,
            },
          ],
        },
      });

      let exists = n > 0 ? true : false;

      if (exists) {
        throw new UserExistsException();
      }

      const newMemeber = await this.prismaService.member.create({
        data: {
          fname,
          lname,
          student_id,
          team_id: null,
          kattis_acct_link,
          tg_username,
          email,
          password: pwd,
          role: 'user',
          registered_at: new Date(),
        },
      });

      const token = jwt.sign(memberData, process.env.JWT_SECRET, {
        expiresIn: '2 days',
      });

      return { token: token, user: newMemeber };
    } catch (error) {
      console.log(error);
      if (error instanceof HttpException) {
        throw new HttpException(error.message, error.getStatus());
      } else {
        throw new HttpException(
          error.meta || 'Error occurred check the log in the server',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }
  }

  @Post('/login')
  async login(@Body() loginData: { identifier: string; password: string }) {
    const { identifier, password } = loginData;
    if (!identifier || !password) {
      throw new IncompleteInputException();
    }

    try {
      const u = await this.prismaService.member.findMany({
        where: {
          OR: [
            {
              email: identifier,
            },
            {
              student_id: identifier,
            },
          ],
        },
      });

      if (u[0]) {
        const isMatch = bcrypt.compareSync(password, u[0].password);
        if (isMatch) {
          const token = jwt.sign(u[0], process.env.JWT_SECRET, {
            expiresIn: '2 days',
          });

          return { token: token, user: u[0] };
        } else {
          throw new InvalidCredentialsException();
        }
      } else {
        throw new UserNotFoundExceptions();
      }
    } catch (error) {
      console.log(error);
      if (error instanceof HttpException) {
        throw new HttpException(error.message, error.getStatus());
      } else {
        throw new HttpException(
          error.meta || 'Error occurred check the log in the server',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }
  }

  @Put('/update/:id')
  async updateProfile(@Param('id') id: number, @Body() updatedData: IMember) {
    const {
      fname,
      lname,
      student_id,
      kattis_acct_link,
      tg_username,
      email,
      password,
    } = updatedData;

    if (!id || !fname || !lname || !password) {
      throw new IncompleteInputException();
    }

    try {
      const u = await this.prismaService.member.findMany({
        where: {
          id: typeof id === 'string' ? parseInt(id) : id,
        },
      });

      if (u[0]) {
        const n = await this.prismaService.member.count({
          where: {
            OR: [
              {
                student_id,
              },
              {
                email,
              },
              {
                kattis_acct_link,
              },
              {
                tg_username,
              },
            ],
          },
        });

        const exists = n > 0 ? true : false;
        if (exists) {
          throw new UserExistsException();
        } else {
          let salt: string = await bcrypt.genSalt(10);
          let pwd: string = await bcrypt.hash(password, salt);
          await this.prismaService.member.update({
            where: {
              id: typeof id === 'string' ? parseInt(id) : id,
            },
            data: {
              fname,
              lname,
              student_id,
              kattis_acct_link,
              tg_username,
              email,
              password: pwd,
            },
          });

          return { message: 'Done!', code: HttpStatus.ACCEPTED };
        }
      } else {
        throw new UserNotFoundExceptions();
      }
    } catch (error) {
      console.log(error);
      if (error instanceof HttpException) {
        throw new HttpException(error.message, error.getStatus());
      } else {
        throw new HttpException(
          error.meta || 'Error occurred check the log in the server',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }
  }

  @Post('/create/:id')
  async createTeam(
    @Param('id') id: number,
    @Body() teamData: { name: string; logo_url: string },
  ) {
    const { name, logo_url } = teamData;
    if (!name || !id || !logo_url) {
      throw new IncompleteInputException();
    }

    try {
      const n = await this.prismaService.team.count({
        where: {
          name,
        },
      });

      const exists = n > 0 ? true : false;

      if (exists) {
        throw new TeamExistsException();
      } else {
        const newTeam = await this.prismaService.team.create({
          data: {
            name,
            logo_url,
            created_At: new Date(),
          },
        });

        await this.prismaService.member.update({
          where: {
            id: typeof id === 'string' ? parseInt(id) : id,
          },
          data: {
            team_id: newTeam.id,
          },
        });

        return { team: newTeam };
      }
    } catch (error) {
      console.log(error);
      if (error instanceof HttpException) {
        throw new HttpException(error.message, error.getStatus());
      } else {
        throw new HttpException(
          error.meta || 'Error occurred check the log in the server',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }
  }

  @Post('/add_member/:id')
  async addTeamMemebers(
    @Param('id') id: number,
    @Body() invitationData: { team_name: string; identifier: string },
  ) {
    console.log(invitationData, id);

    const { team_name, identifier } = invitationData;
    if (!id || !team_name || !identifier) {
      throw new IncompleteInputException();
    }

    try {
      const u = await this.prismaService.member.findMany({
        where: {
          OR: [
            {
              student_id: identifier,
            },
            {
              email: identifier,
            },
            {
              tg_username: identifier,
            },
          ],
        },
      });

      if (u[0]) {
        await this.prismaService.invitation.create({
          data: {
            member_id: u[0].id,
            invitor_id: typeof id === 'string' ? parseInt(id) : id,
            team_name,
          },
        });

        return {
          message: 'Invitation sent!!',
          code: HttpStatus.OK,
        };
      } else {
        throw new UserNotFoundExceptions();
      }
    } catch (error) {
      console.log(error);
      if (error instanceof HttpException) {
        throw new HttpException(error.message, error.getStatus());
      } else {
        throw new HttpException(
          error.meta || 'Error occurred check the log in the server',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }
  }

  @Get('/notifications/:id')
  async getNotifications(@Param('id') id: number) {
    if (!id) {
      throw new IncompleteInputException();
    }

    try {
      const invitations = await this.prismaService.invitation.findMany({
        where: {
          member_id: typeof id === 'string' ? parseInt(id) : id,
        },
      });

      return { data: invitations, code: HttpStatus.OK };
    } catch (error) {
      console.log(error);
      if (error instanceof HttpException) {
        throw new HttpException(error.message, error.getStatus());
      } else {
        throw new HttpException(
          error.meta || 'Error occurred check the log in the server',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }
  }

  @Put('/resolve/:id')
  async resolveInvitation(
    @Param('id') id: number,
    @Body() decisionData: { invitation_id: number; decision: string },
  ) {
    const { invitation_id, decision } = decisionData;
    if (!invitation_id || !decision) {
      throw new IncompleteInputException();
    }

    try {
      if (decision === 'accept') {
        await this.prismaService.invitation.update({
          where: {
            id: invitation_id,
          },
          data: {
            status: invitation_status.accepted,
          },
        });

        const inv = await this.prismaService.invitation.findMany({
          where: {
            id: invitation_id,
          },
        });

        const team = await this.prismaService.team.findMany({
          where: {
            name: inv[0].team_name,
          },
        });

        await this.prismaService.member.update({
          where: {
            id: typeof id === 'string' ? parseInt(id) : id,
          },
          data: {
            team_id: team[0].id,
          },
        });
      } else {
        await this.prismaService.invitation.update({
          where: {
            id: invitation_id,
          },
          data: {
            status: invitation_status.declined,
          },
        });
      }

      return { message: 'Done!', code: HttpStatus.ACCEPTED };
    } catch (error) {
      console.log(error);
      if (error instanceof HttpException) {
        throw new HttpException(error.message, error.getStatus());
      } else {
        throw new HttpException(
          error.meta || 'Error occurred check the log in the server',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }
  }

  @Put('/update/team/:id')
  async updateTeamProfile(
    @Param('id') id: number,
    @Body() updateData: { name: string; logo_url: string },
  ) {
    const { name, logo_url } = updateData;
    if (!id) {
      throw new IncompleteInputException();
    }

    try {
      const n = await this.prismaService.team.count({
        where: {
          name,
        },
      });

      const exists = n > 0 ? true : false;
      if (exists) {
        throw new TeamExistsException();
      } else {
        await this.prismaService.team.update({
          where: {
            id: typeof id === 'string' ? parseInt(id) : id,
          },
          data: {
            name,
            logo_url,
          },
        });

        return { message: 'Done!', code: HttpStatus.ACCEPTED };
      }
    } catch (error) {
      console.log(error);
      if (error instanceof HttpException) {
        throw new HttpException(error.message, error.getStatus());
      } else {
        throw new HttpException(
          error.meta || 'Error occurred check the log in the server',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }
  }

  // not tested
  @Post('/apply/tournament/:id')
  async apply(
    @Param('id') id: number,
    @Body() applicationData: { team_id: number; tournament_id: number },
  ) {
    const { team_id, tournament_id } = applicationData;
    if (!id || !tournament_id) {
      throw new IncompleteInputException();
    }

    try {
      const tourny = await this.prismaService.tournament.findMany({
        where: {
          id:
            typeof tournament_id === 'string'
              ? parseInt(tournament_id)
              : tournament_id,
        },
      });

      if (tourny[0]) {
        if (!team_id && tourny[0].type === 'cup') {
          await this.prismaService.application.create({
            data: {
              member_id: typeof id === 'string' ? parseInt(id) : id,
              tournament_id,
              created_at: new Date(),
            },
          });

          return { message: 'Done!', code: HttpStatus.ACCEPTED };
        } else if (team_id && tourny[0].type === 'league') {
          await this.prismaService.application.create({
            data: {
              team_id:
                typeof team_id === 'string' ? parseInt(team_id) : team_id,
              tournament_id,
              created_at: new Date(),
            },
          });

          return { message: 'Done!', code: HttpStatus.ACCEPTED };
        } else {
          throw new IncompleteInputException();
        }
      } else {
        throw new TeamNotFoundException();
      }
    } catch (error) {
      console.log(error);
      if (error instanceof HttpException) {
        throw new HttpException(error.message, error.getStatus());
      } else {
        throw new HttpException(
          error.meta || 'Error occurred check the log in the server',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }
  }

  @Get('/tournament/:id')
  async getTournament() {}
}
