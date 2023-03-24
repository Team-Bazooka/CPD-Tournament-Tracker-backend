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