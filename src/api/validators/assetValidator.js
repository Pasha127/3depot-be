import { checkSchema, validationResult } from "express-validator"
import createHttpError from "http-errors"

const assetSchema = {
  name: {
    in: ["body"],
    isString: {
      errorMessage: "Name is a mandatory field and needs to be a string!",
    }
  },
  type: {
    in: ["body"],
    isString: {
      errorMessage: "Type is a mandatory field and needs to be a string!",
    }
  },
  link: {
    in: ["body"],
    isString: {
      errorMessage: "Link is a mandatory field and needs to be a string!",
    }
  }
}



export const checkAssetSchema = checkSchema(assetSchema) 
export const checkValidationResult = (req, res, next) => { 
  const errors = validationResult(req)
  if (!errors.isEmpty()) {   
    next(
      createHttpError(400, "Validation Error - Asset Body", {
        errorsList: errors.array(),
      })
    );
    console.log("400 in Asset Validator: ", errors); 
  } else {
    next()
  }
}