import { checkSchema, validationResult } from "express-validator"
import createHttpError from "http-errors"

const userSchema = {
  email: {
    in: ["body"],
    isString: {
      errorMessage: "Name is a mandatory field and needs to be a string!",
    }
  },
  password: {
    in: ["body"],
    isString: {
      errorMessage: "Password is a mandatory field and needs to be a string!",
    }
  }
}



export const checkUserSchema = checkSchema(userSchema) 
export const checkValidationResult = (req, res, next) => { 
  const errors = validationResult(req)
  if (!errors.isEmpty()) {   
    next(
      createHttpError(400, "Validation errors in user request body!", {
        errorsList: errors.array(),
      })
    );
    console.log("400 in user validator", errors); //<--- DELETE LATER
  } else {
    next()
  }
}