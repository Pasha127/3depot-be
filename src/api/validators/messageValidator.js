import { checkSchema, validationResult } from "express-validator"
import createHttpError from "http-errors"

const messageSchema = {
  "content.text": {
    in: ["body"],
    isString: {
      errorMessage: "Text content is a mandatory field and needs to be a string!",
    }
  }
}


export const checkMessageSchema = checkSchema(messageSchema) 
export const checkValidationResult = (req, res, next) => { 
  const errors = validationResult(req)
  if (!errors.isEmpty()) {   
    next(
      createHttpError(400, "Validation errors in message request body!", {
        errorsList: errors.array(),
      })
    );
    console.log("400 in message validator", errors); 
  } else {
    next()
  }
}