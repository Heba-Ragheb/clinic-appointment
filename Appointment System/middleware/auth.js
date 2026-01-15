import jwt from "jsonwebtoken"

export const authJwt = (req,res,next)=>{
    try {
        const token = req.cookies.token
        if (!token) {
			return res.status(401).json({ message: "Access denied" });
		}
        
        jwt.verify(token,
            process.env.JWT_SECRET,
            (error,decodedToken)=>{
                if(error){
                    	return res.status(401).json({ message: "Invalid token" });
                }
                req.user = decodedToken
                
                next()
            })
    } catch (error) {
        return res.status(500).json({
			message: "An error occurred while logging in",
		});
    }
    
}