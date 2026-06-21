import mongoose,{Schema} from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
const userSchema = new Schema({
    username: 
    { 
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        index:true
        
    },
    fullName: 
    { 
        type: String, 
        required: true ,
        trim: true,
        index:true
    },
    watchHistory: [
        {
            type:Schema.Types.ObjectId,
            ref:"Video"
        }
    ],
    avatar: 
    { 
        type: String,
        required: true, 
        
    },
    coverImage: 
    { 
        type: String,
        required: false,
       
    },
    email:
    {
        type: String,
        required: [true, "Email is required"],
        unique: true ,
        trim: true,
        lowercase: true,
        index:true           

    },
    password: 
    { 
        type: String, 
        required: false 
    },
    mobileNumber:
    {
        type: String,
        required: false
    },
    googleId:
    {
        type: String,
        required: false
    },
    githubId:
    {
        type: String,
        required: false
    },
    instagramId:
    {
        type: String,
        required: false
    },
    provider:
    {
        type: String,
        default: "local"
    },
    refreshToken:
    {
        type: String,
        required: false
    },
    createdAt: 
    { 
        type: Date, 
        default: Date.now 
    }
});



/*
===============================================================================
                🔐 AUTHENTICATION USING bcrypt + JWT + Cookies
===============================================================================

This project uses bcrypt and JWT together to implement secure login authentication.

-----------------------------------
WHY WE NEED THIS?
-----------------------------------
If we store passwords in plain text, anyone who hacks the database can see all passwords.
If we don't use tokens, the server cannot remember logged-in users.

So we use:
  bcrypt → secure password
  JWT → login identity
  cookie → store token in browser

-----------------------------------
1️⃣ bcrypt (Password Security)
-----------------------------------
bcrypt is used to HASH passwords before saving them to database.

Signup:
  password → bcrypt.hash() → store hash

Example:
  "mypassword123"
  becomes
  "$2b$10$ksjdhfksjdhf..."

Even admin cannot see the real password.

Login:
  bcrypt.compare(enteredPassword, storedHash)

If match → login allowed
If not → reject

👉 bcrypt protects passwords


-----------------------------------
2️⃣ JWT (Login Token)
-----------------------------------
JWT = JSON Web Token
It is a digital identity card for logged-in users.

After login success:
  server creates token using jwt.sign()

Example:
  jwt.sign({ id: user._id }, SECRET_KEY)

Token contains:
  - user id
  - role
  - expiry time
  - digital signature

👉 JWT proves the user is authenticated


-----------------------------------
3️⃣ Cookies (Storage)
-----------------------------------
The JWT token is stored inside browser cookie:

  res.cookie("token", jwt)

Browser automatically sends it with every request.

👉 Cookie stores the token


-----------------------------------
FULL LOGIN FLOW
-----------------------------------

Signup:
  user password → bcrypt.hash → store in DB

Login:
  bcrypt.compare → if correct
  → create JWT
  → send JWT in cookie

Next Requests:
  browser sends cookie
  → backend verifies jwt.verify()
  → user allowed


-----------------------------------
WHY THIS METHOD IS SECURE?
-----------------------------------
✅ Password never stored in plain text
✅ Token is signed (cannot be modified)
✅ Stateless (no session storage needed)
✅ Fast and scalable
✅ Industry standard (used in MERN apps)


-----------------------------------
QUICK MEMORY TRICK
-----------------------------------
bcrypt  → hides password
JWT     → remembers login
cookie  → stores token

-----------------------------------
SUMMARY
-----------------------------------
bcrypt secures passwords.
JWT handles authentication.
Cookies store the token.
Together they create a complete secure login system.
===============================================================================
*/



userSchema.pre("save", async function () {
    // error resolved by copilot: In Mongoose v6+, async pre-save hooks don't require next parameter or next() calls. Removed them to prevent "next is not a function" error.
    if(!this.isModified("password") || !this.password){
        return;
    }
    this.password = await bcrypt.hash(this.password,10)
    
});
userSchema.methods.isPasswordcorrect = async function (password) {
    if (!this.password) return false;
    return await bcrypt.compare(password, this.password);
}
// here the bug fixed by copilot and the bug is controller called isPasswordMatched but model defined isPasswordcorrect. Explanation: This caused method not found errors when validating passwords.
userSchema.methods.isPasswordMatched = userSchema.methods.isPasswordcorrect;
userSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        {
            _id: this._id,
            username: this.username,
            email: this.email,
            fullName: this.fullName
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    );
}
userSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
        {
            _id: this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    );
}

const User = mongoose.model("User", userSchema);
export default User;