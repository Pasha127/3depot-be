import { checkSchema, validationResult } from "express-validator"
import createHttpError from "http-errors"

const chatSchema = {
  members: {
    in: ["body"]
  }
}



export const checkChatSchema = checkSchema(chatSchema) 
export const checkValidationResult = (req, res, next) => { 
  const errors = validationResult(req)
  if (!errors.isEmpty()) {   
    next(
      createHttpError(400, "Validation errors in chat request body!", {
        errorsList: errors.array(),
      })
    );
    console.log("400 in chat validator", errors); //<--- DELETE LATER
  } else {
    next()
  }
}