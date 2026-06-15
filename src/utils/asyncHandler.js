
// higher order function to handle aysnc errorr in express rout it do work as a wraper function over the request respose way of clint and server the data coming fron the clint it 
// may wrong due to server issue or clint issue so to handle that we use this higher order function
const asyncHandler =(fn)=> async (req,res,next)=>{
    try {
        await fn(req,res,next)
    } catch (error) {
        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message,
            data: null,
            errors: error.errors || []
        });
    }
}
export{asyncHandler} 