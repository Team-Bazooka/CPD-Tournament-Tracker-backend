import { HttpException, HttpStatus } from "@nestjs/common";

export class IncompleteInputException extends HttpException {
    constructor(){
        super("Please enter all fields!!", HttpStatus.NOT_ACCEPTABLE)
    }       
}

export class UserExistsException extends HttpException {
    constructor(){
        super("User already exists with this information!!", HttpStatus.BAD_REQUEST)
    }
}

export class InvalidCredentialsException extends HttpException {
    constructor(){
        super('Invalid credentials!!',
        HttpStatus.NOT_ACCEPTABLE)
    }
}

export class UserNotFoundExceptions extends HttpException {
    constructor(){
        super( 'User not found!!',
        HttpStatus.BAD_REQUEST)
    }
}

export class InputAlreadyTakenException extends HttpException {
    constructor(message: string){
        super(message, HttpStatus.BAD_REQUEST)
    }
}

export class TeamExistsException extends HttpException {
    constructor(){
        super("Team already exists with this information!!", HttpStatus.BAD_REQUEST)
    }
}