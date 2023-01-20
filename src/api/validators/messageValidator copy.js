import { checkSchema, validationResult } from "express-validator"
import createHttpError from "http-errors"

const commentSchema = {
  "content.text": {
    in: ["body"],
    isString: {
      errorMessage: "Text content is a mandatory field and needs to be a string!",
    }
  }
}


export const checkCommentSchema = checkSchema(commentSchema) 
export const checkValidationResult = (req, res, next) => { 
  const errors = validationResult(req)
  if (!errors.isEmpty()) {   
    next(
      createHttpError(400, "Validation errors in comment request body!", {
        errorsList: errors.array(),
      })
    );
    console.log("400 in comment validator", errors); 
  } else {
    next()
  }
}