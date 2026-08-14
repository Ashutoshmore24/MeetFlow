import jwt from "jsonwebtoken";

export const generateToken = (userId, res) => {
    // generate the token
    const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
        expiresIn: "2d",
    });

    const isProduction = process.env.NODE_ENV === "production";

    // send it as a cookie in the response
    res.cookie("jwt", token, {
        httpOnly: true,  // prevent XSS (cross-site scripting) attacks
        secure: isProduction,  // HTTPS only in production
        sameSite: isProduction ? "none" : "lax",  // 'none' needed for cross-origin cookies on Render
        maxAge: 2 * 24 * 60 * 60 * 1000, // 2 days
    });
    
    return token;
}
    