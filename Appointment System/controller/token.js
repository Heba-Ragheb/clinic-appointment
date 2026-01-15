import jwt from 'jsonwebtoken'
import dotenv from "dotenv"

export const generateToken = (user)=>{
 const token = jwt.sign({_id:user._id,role:user.role,name:user.name,email:user.email},
    process.env.JWT_SECRET,
    {expiresIn:"24h"}
     )
     return token
}
export const verifyToken = (token)=>{
    try {
        const user = jwt.verify(token, process.env.JWT_SECRET)
        return user
    } catch (error) {
        throw new Error("Invalid or expired token")
    }
}