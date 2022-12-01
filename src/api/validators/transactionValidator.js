import { checkSchema, validationResult } from "express-validator"
import createHttpError from "http-errors"

const transactionSchema = {
  user: {
    in: ["body"]
  },
  moneyCharged: {
    in: ["body"]
  },
  creditsEarned: {
    in: ["body"]
  }
}



export const checkTransactionSchema = checkSchema(transactionSchema) 
export const checkValidationResult = (req, res, next) => { 
  const errors = validationResult(req)
  if (!errors.isEmpty()) {   
    next(
      createHttpError(400, "Validation Error - Transaction Body", {
        errorsList: errors.array(),
      })
    );
    console.log("400 in Transaction Validator: ", errors); 
  } else {
    next()
  }
}