import jwt from "jsonwebtoken";

export const isAuthenticated = async (req, res, next) => {
    try {
        const token = req.cookies.token;
        if(!token){
            return res.status(401).json({
                success: false,
                message: "User not authenticated",
            });
        }

        const decode = await jwt.verify(token, process.env.SECRET_KEY);
        if(!decode){
            return res.status(401).json({
                success: false,
                message: "Invalid",
            });
        }
        req.id = decode.userId;
        next();
    }
     catch (error) {
        console.log("authentication error", error);
        return res.status(401).json({
            success: false,
            message: "User not authenticated",
        });
    }
}

export default isAuthenticated;