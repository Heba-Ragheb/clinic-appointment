import User from "../models/user.js"
import bcrypt from "bcryptjs"
import { generateToken, verifyToken } from "./token.js"

export const register = async (req, res) => {
    try {
        const { name, email, password, role,specialty,bio ,phone} = req.body;
        const existing = await User.findOne({email})
        if(existing){
            res.status(400).json({ message: "User with this email already exists" });
       } else{
        const newPassword = await bcrypt.hash(password, 10)
     
        const user = new User({ name, email, password: newPassword, role,specialty,bio ,phone })
        const newUser = await user.save()
        const token = generateToken(user)
        res.cookie("token", token, {
            httpOnly: true,
            secure: true,
            sameSite: "None",
            maxAge: 30 * 24 * 60 * 60 * 1000,
        })
        res.status(200).json({ message: "user added", user: newUser, token })}
    } catch (error) {
        res.status(400).send({
            message: "An error occurred while registeration",
            error: error.message,
        });
    }
}

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const passwordCheck = await bcrypt.compare(password, user.password);
    if (!passwordCheck) {
      return res.status(400).json({ message: "Email or password incorrect" });
    }

    // Generate JWT
    const token = generateToken(user);

    // Set cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "None",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      message: "User logged in",
      user,
      token, // Also return token in response
    });

  } catch (error) {
    return res.status(500).json({
      message: "An error occurred while logging in",
      error: error.message,
    });
  }
};

export const getCurrentUser = async (req, res) => {
   try {
     const token = req.cookies.token;
     
     if (!token) {
       return res.status(401).json({ message: "Not authenticated" });
     }

     const decoded = verifyToken(token);
    
     const user = await User.findById(decoded._id).select('-password');
     
     if (!user) {
       return res.status(404).json({ message: "User not found" });
     }

     res.status(200).json({ user });
 
   } catch (error) {
     res.status(401).json({
       message: "Invalid or expired token",
       error: error.message,
     });
   }
}

export const logout = async(req, res) => {
    try {
        res.clearCookie("token")
        res.status(200).json({ message: "Logged out successfully" });
    } catch (error) {
         res.status(401).json({
            message: "Invalid or expired token",
            error: error.message,
        });
    }
}