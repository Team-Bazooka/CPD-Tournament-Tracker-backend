import {
  Body,
  Controller,
  Post,
  HttpException,
  HttpStatus,
  Param,
  Put,
} from '@nestjs/common';
import { PrismaService } from 'src/utils/prisma.service';
import { IMember } from 'src/utils/types';
import {
  IncompleteInputException,
  InvalidCredentialsException,
  UserExistsException,
  UserNotFoundExceptions,
} from 'src/utils/exceptions';
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
          team_id: 0,
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
  async updateProfile(@Param("id") id: number, @Body() updatedData: IMember) {
    const {
      fname,
      lname,
      student_id,
      kattis_acct_link,
      tg_username,
      email,
      password,
    } = updatedData;

    if (
      !id ||
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

    try {
      const u = await this.prismaService.member.findMany({
        where: {
            id: typeof id === "string" ? parseInt(id) : id
        }
      });

      if (u[0]) {
        let salt: string = await bcrypt.genSalt(10);
          let pwd: string = await bcrypt.hash(password, salt);
          await this.prismaService.member.update({
            where: {
              id: typeof id === "string" ? parseInt(id) : id
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

          return { message: "Done!", code: HttpStatus.ACCEPTED }
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
}
