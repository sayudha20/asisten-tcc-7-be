import User from "../models/UserModel.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// GET
async function getUsers(req, res) {
  try {
    const users = await User.findAll();
    res.status(200).json({
      status: "Success",
      message: "Users Retrieved",
      data: users,
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      status: "Error",
      message: error.message,
    });
  }
}

// GET BY ID
async function getUserById(req, res) {
  try {
    const user = await User.findOne({ where: { id: req.params.id } });
    if (!user) {
      const error = new Error("User tidak ditemukan 😮");
      error.statusCode = 400;
      throw error;
    }
    res.status(200).json({
      status: "Success",
      message: "User Retrieved",
      data: user,
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      status: "Error",
      message: error.message,
    });
  }
}

// CREATE
async function createUser(req, res) {
  try {
    // Mengambil name, email, gender, password dari request body
    const { name, email, gender, password } = req.body;

    // Mengenkripsi password
    const encryptPassword = await bcrypt.hash(password, 5);

    // Buat ngecek apakah ada request body yg belum diisi
    if (!name || !email || !gender || !password) {
      const msg = `${
        !name ? "Name" : !email ? "Email" : !password ? "Password" : "Gender"
      } field cannot be empty 😠`;
      const error = new Error(msg);
      error.statusCode = 401;
      throw error;
    }

    // Masukkin user ke DB
    await User.create({
      name: name,
      email: email,
      gender: gender,
      password: encryptPassword,
    });

    // Kalo berhasil ngirim respons kaya di bawah
    res.status(201).json({
      status: "Success",
      message: "User Registered",
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      status: "Error",
      message: error.message,
    });
  }
}

async function updateUser(req, res) {
  try {
    const { name, email, gender } = req.body;
    const ifUserExist = await User.findOne({ where: { id: req.params.id } });

    if (!name || !email || !gender) {
      const msg = `${
        !name ? "Name" : !email ? "Email" : "Gender"
      } field cannot be empty 😠`;
      const error = new Error(msg);
      error.statusCode = 401;
      throw error;
    }

    if (!ifUserExist) {
      const error = new Error("User tidak ditemukan 😮");
      error.statusCode = 400;
      throw error;
    }

    await User.update(req.body, {
      where: { id: req.params.id },
    });

    res.status(200).json({
      status: "Success",
      message: "User Updated",
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      status: "Error",
      message: error.message,
    });
  }
}

async function deleteUser(req, res) {
  try {
    const ifUserExist = await User.findOne({ where: { id: req.params.id } });
    if (!ifUserExist) {
      const error = new Error("User tidak ditemukan 😮");
      error.statusCode = 400;
      throw error;
    }

    await User.destroy({ where: { id: req.params.id } });
    res.status(200).json({
      status: "Success",
      message: "User Deleted",
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      status: "Error",
      message: error.message,
    });
  }
}

// Fungsi buat login
async function login(req, res) {
  try {
    // Login menggunakan email dan password
    const { email, password } = req.body;

    // Cek apakah email terdaftar
    const user = await User.findOne({
      where: { email: email },
    });

    // Kalo email ada (terdaftar)
    if (user) {
      // Data User itu nanti bakalan dipake buat ngesign token
      // Data user dari sequelize itu harus diubah dulu ke bentuk object
      const userPlain = user.toJSON(); // Konversi ke object

      // Ngecek isi dari userplain (tidak wajib ditulis, cuma buat ngecek saja)
      console.log(userPlain);

      // Disini kita mau mengcopy isi dari variabel userPlain ke variabel baru namanya safeUserData
      // Tapi di sini kita gamau copy semuanya, kita gamau copy password sama refresh_token karena itu sensitif
      const { password: _, refresh_token: __, ...safeUserData } = userPlain;

      // Ngecek apakah password sama kaya yg ada di DB
      const decryptPassword = await bcrypt.compare(password, user.password);

      // Kalau password benar, artinya berhasil login
      if (decryptPassword) {
        // Access token expire selama 30 detik
        const accessToken = jwt.sign(
          safeUserData,
          process.env.ACCESS_TOKEN_SECRET,
          { expiresIn: "30s" }
        );

        // Refresh token expire selama 1 hari
        const refreshToken = jwt.sign(
          safeUserData,
          process.env.REFRESH_TOKEN_SECRET,
          { expiresIn: "1d" }
        );

        // Update tabel refresh token pada DB
        await User.update(
          { refresh_token: refreshToken },
          {
            where: { id: user.id },
          }
        );

        // Masukkin refresh token ke cookie
        res.cookie("refreshToken", refreshToken, {
          httpOnly: false, // Ngatur cross-site scripting, untuk penggunaan asli aktifkan karena bisa nyegah serangan fetch data dari website "document.cookies"
          sameSite: "none", // Ngatur domain yg request misal kalo strict cuman bisa akses ke link dari dan menuju domain yg sama, lax itu bisa dari domain lain tapi cuman bisa get
          maxAge: 24 * 60 * 60 * 1000, // Ngatur lamanya token disimpan di cookie (dalam satuan ms)
          secure: true, // Ini ngirim cookies cuman bisa dari https, kenapa? nyegah skema MITM di jaringan publik, tapi pas development di false in aja
        });

        // Kirim respons berhasil (200)
        res.status(200).json({
          status: "Success",
          message: "Login Berhasil",
          safeUserData,
          accessToken,
        });
      } else {
        // Kalau password salah
        const error = new Error("Paassword atau email salah");
        error.statusCode = 400;
        throw error;
      }
    } else {
      // Kalau email salah
      const error = new Error("Paassword atau email salah");
      error.statusCode = 400;
      throw error;
    }
  } catch (error) {
    res.status(error.statusCode || 500).json({
      status: "Error",
      message: error.message,
    });
  }
}

// Fungsi logout
async function logout(req, res) {
  try {
    // ngambil refresh token di cookie
    const refreshToken = req.cookies.refreshToken;

    // Ngecek ada ga refresh tokennya, kalo ga ada kirim status code 204
    if (!refreshToken) {
      const error = new Error("Refresh token tidak ada");
      error.statusCode = 204;
      throw error;
    }

    // Kalau ada, cari user berdasarkan refresh token tadi
    const user = await User.findOne({
      where: { refresh_token: refreshToken },
    });

    // Kalau user gaada, kirim status code 204
    if (!user.refresh_token) {
      const error = new Error("User tidak ditemukan");
      error.statusCode = 204;
      throw error;
    }

    // Kalau user ketemu (ada), ambil user id
    const userId = user.id;

    // Hapus refresh token dari DB berdasarkan user id tadi
    await User.update(
      { refresh_token: null },
      {
        where: { id: userId },
      }
    );

    // Ngehapus refresh token yg tersimpan di cookie
    res.clearCookie("refreshToken");

    // Kirim respons berhasil (200)
    res.status(200).json({
      status: "Success",
      message: "Logout Berhasil",
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      status: "Error",
      message: error.message,
    });
  }
}

export {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  login,
  logout,
};
