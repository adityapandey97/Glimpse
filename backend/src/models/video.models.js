import mongoose,{ Schema } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
const videoSchema = new Schema({
    // here the bug fixed by copilot and the bug is unnecessary id field with unique constraint conflicted with MongoDB's auto _id. Explanation: This could cause duplicate key errors and was redundant since MongoDB provides _id automatically.
    videoFile:{
        type:String,
        required:true,
    },
    thumbnail:{
        type:String,
        required:true,
    },
    title:{
        type:String,
        required:true,
    },
    description:{
        type:String,
        required:true,
    },
    views:{
        type:Number,
        default:0
    },
    // here the bug fixed by copilot and the bug is typo duretion -> duration. Explanation: This caused field name mismatch, potentially leading to undefined values.
    duration:{
        type:Number,
        required:true,
    },
    // here the bug fixed by copilot and the bug is typo isPublised -> isPublished. Explanation: This caused field name mismatch in queries and updates.
    isPublished:{
        type:Boolean,
        default:false
    },
    owner:{
        type:Schema.Types.ObjectId,
        ref:"User",
        required:true
    }},
    {
        timestamps:true
    }
);

/*
  ======================= PAGINATION USING mongoose-paginate-v2 =======================

  WHY PAGINATION IS NEEDED:
  --------------------------
  When a database contains a large number of records (for example: patients, doctors,
  appointments, users, etc.), fetching all records at once using Model.find() is very bad
  for performance. It makes the server slow, uses too much memory, and makes the frontend
  slow or even crash.

  Pagination means:
  -----------------
  Instead of sending all records, we send data in small parts (pages).
  Example:
    Page 1 -> 10 records
    Page 2 -> 10 records
    Page 3 -> 10 records

  WHAT IS mongoose-paginate-v2:
  -----------------------------
  mongoose-paginate-v2 is a Mongoose plugin that makes pagination very easy and powerful.
  It adds a function called "paginate()" to the model, so we can write:

    Model.paginate(query, options)

  instead of writing complex skip-limit logic manually.

  HOW TO USE IT:
  --------------
  1) Install:
     npm install mongoose-paginate-v2

  2) Add plugin to schema:
     schema.plugin(mongoosePaginate);

  3) Use in controller:
     const result = await Model.paginate(query, {
        page: 1,
        limit: 10,
        sort: { createdAt: -1 }
     });

  WHAT IT RETURNS:
  ----------------
  The paginate() function returns an object like:

  {
    docs: [],           // actual data of current page
    totalDocs: 100,     // total records in database
    limit: 10,          // records per page
    page: 1,            // current page
    totalPages: 10,     // total pages
    hasNextPage: true,
    hasPrevPage: false,
    nextPage: 2,
    prevPage: null
  }

  IMPORTANT OPTIONS:
  ------------------
  {
    page: 1,                 // which page to fetch
    limit: 10,               // how many records per page
    sort: { createdAt: -1 }, // sorting
    select: "name age",      // select specific fields
    populate: "doctor",      // populate references
    lean: true               // return plain JS objects (faster)
  }

  WHERE WE USE THIS:
  ------------------
  - Patient list
  - Doctor list
  - Appointment list
  - Admin dashboard lists
  - Logs, reports, large tables

  WHY THIS IS PROFESSIONAL:
  -------------------------
  - Faster API responses
  - Less memory usage
  - Better performance
  - Scalable for large data
  - Clean and maintainable code

  SIMPLE EXAMPLE:
  ---------------
  GET /patients?page=2&limit=10

  Backend will return ONLY 10 records of page 2 instead of whole database.

  SUMMARY:
  --------
  mongoose-paginate-v2 is used to efficiently fetch large data in small pages instead of
  loading everything at once, making the backend fast, scalable, and production-ready.

  ================================================================================
*/
videoSchema.plugin(mongoosePaginate);
// here the bug fixed by copilot and the bug is model name "VIDEOS" -> "Video". Explanation: Inconsistent naming convention, should be singular "Video" to match other models.
const Video = mongoose.model("Video", videoSchema);
export default  Video ;