import jwt from "jsonwebtoken";

export const generateToken = (userId, res) => {
    // generate the token
    const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
        expiresIn: "2d",
    });

    // send it as a cookie in the response
    res.cookie("jwt", token, {
        httpOnly: true,  // prevent XSS (cross-site scripting) attacks
        secure: process.env.NODE_ENV === "development" ? false : true,
        sameSite: "strict",  // prevent CSRF (cross-site request forgery) attacks
        maxAge: 2 * 24 * 60 * 60 * 1000, // 2 days
    });
    
    return token;
}
    