import { Body, Controller, Post, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from 'src/utils/prisma.service';
import { IMember } from 'src/utils/types';
import { IncompleteInputException, UserExistsException } from 'src/utils/exceptions';
import * as jwt from "jsonwebtoken";
import * as bcrypt from 'bcryptjs';

@Controller('api/member')
export class MemberController {
    constructor(
        private readonly prismaService: PrismaService
    ){}

    @Post('/signup')
    async signup(
        @Body() memberData: IMember
    ){
        const { fname, lname, student_id, kattis_acct_link, email, password } = memberData;
        if(!fname || !lname || !student_id || !kattis_acct_link || !email || !password){
           throw new IncompleteInputException();
        }

        let salt: string = await bcrypt.genSalt(10);
        let pwd: string = await bcrypt.hash(password, salt);

        try {
            const n = await this.prismaService.member.count({
                where: {
                    OR: [
                        {
                            email
                        },
                        {
                            student_id
                        },
                        {
                            kattis_acct_link
                        }
                    ]
                }
            })

            let exists = n > 0 ? true: false;

            if(exists){
                throw new UserExistsException();
            }
            
            const newMemeber = await this.prismaService.member.create({
                data: {
                    fname,
                    lname,
                    student_id,
                    team_id: 0,
                    kattis_acct_link,
                    email,
                    password: pwd,
                    role: "user",
                    registered_at: new Date()
                }
            })

            const token = jwt.sign( memberData, process.env.JWT_SECRET, {
                expiresIn: '2 days',
              });
        
            return { token: token, user: newMemeber };

        } catch (error) {
            console.log(error);
            if (error instanceof HttpException) {
              throw new HttpException(error, HttpStatus.BAD_REQUEST);
            } else {
              throw new HttpException(
                error.meta || 'Error occurred check the log in the server',
                HttpStatus.INTERNAL_SERVER_ERROR,
              );
            }
        }
    }

    @Post('/login')
    async login(
        @Body() loginData: { identifier:string, password:string }
    ){

    }

}
