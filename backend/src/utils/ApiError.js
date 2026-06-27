/*
  ApiError is a custom error class used to handle all API errors in a clean and consistent way.
  Instead of throwing normal Error, we throw ApiError with proper HTTP status codes and messages.
  Whenever an error occurs in any controller, we throw new ApiError(...).
  This error is caught by asyncHandler and passed to the global error middleware.
  The global error middleware then sends a fixed JSON response format like:

  {
    success: false,
    data: null,
    message: "Error message here",
    errors: []
  }

  This approach helps to:
  - Avoid server crash
  - Keep all error responses in the same format
  - Send correct HTTP status codes (400, 401, 404, 500, etc.)
  - Make debugging easier using stack trace
  - Keep controllers clean and readable
*/

class ApiError extends Error {
    // here the bug fixed by copilot and the bug is constructor parameter order was (message, statusCode) but called as (statusCode, message), causing wrong assignment. Also typo sucsses -> success. Explanation: This caused statusCode and message to be swapped, leading to incorrect HTTP responses and error messages.
    constructor(
        statusCode,
        message="something went wrong",
        errors=[],
        stack=""
    ) {
        super(message);
        this.statusCode = statusCode;
        this.message = message;
        this.data=null
        this.errors = errors;
        this.success = false;
        if(stack){
            this.stack=stack;
        }else{
            Error.captureStackTrace(this,this.constructor);
        }

    }
}    
export {ApiError}