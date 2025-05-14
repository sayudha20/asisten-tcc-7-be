import User from "../models/UserModel.js";
import jwt from "jsonwebtoken";

export const getAccessToken = async (req, res) => {
  try {
    // Ambil refresh token dari cookie, simpan ke dalam variabel "refreshToken"
    const refreshToken = req.cookies.refreshToken;

    // Kalau refresh token gaada, kasih error (401)
    if (!refreshToken) {
      const error = new Error("Refresh token tidak ada");
      error.statusCode = 401;
      throw error;
    }

    // Cari user yg punya refresh token yg sama di db
    const user = await User.findOne({
      where: { refresh_token: refreshToken },
    });

    // Kalo user ga ketemu, kasih error (401)
    if (!user.refresh_token) {
      const error = new Error("Refresh token tidak ada");
      error.statusCode = 401;
      throw error;
    }
    // Kalo ketemu
    else {
      jwt.verify(
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET,
        (err, decoded) => {
          if (err) return res.sendStatus(403);

          const userPlain = user.toJSON(); // Konversi ke object
          const { password: _, refresh_token: __, ...safeUserData } = userPlain;
          const accessToken = jwt.sign(
            safeUserData,
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: "30s" }
          );
          return res.status(200).json({
            status: "Success",
            message: "Login Berhasil",
            accessToken,
          });
        }
      );
    }
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      status: "Error",
      message: error.message,
    });
  }
};
