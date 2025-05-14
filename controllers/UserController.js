import User from "../models/UserModel.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// GET USER
async function getUsers(req, res) {
  try {
    // Lakukan query "SELECT * nama_tabel" ke db, simpan ke dalam variabel "users"
    const users = await User.findAll();

    // Kirim respons sukses (200)
    return res.status(200).json({
      status: "Success",
      message: "Users Retrieved",
      data: users,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      status: "Error",
      message: error.message,
    });
  }
}

// GET USER BY ID
async function getUserById(req, res) {
  try {
    /*
      Lakukan query "SELECT * nama_tabel WHERE id = id" ke db
      id diambil dari parameter dari endpoint.
      Setelah itu, simpan hasil query ke dalam variabel "user"
    */
    const user = await User.findOne({ where: { id: req.params.id } });

    // Cek user yg diambil ada apa engga
    // Kalo user gada, masuk ke catch dengan message "User tidak ditemukan 😮" (400)
    if (!user) {
      const error = new Error("User tidak ditemukan 😮");
      error.statusCode = 400;
      throw error;
    }

    // Kalo user ada, kirim respons sukses (200)
    return res.status(200).json({
      status: "Success",
      message: "User Retrieved",
      data: user,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      status: "Error",
      message: error.message,
    });
  }
}

// CREATE USER
async function createUser(req, res) {
  try {
    // Mengambil name, email, gender, password dari request body
    const { name, email, gender, password } = req.body;

    // Ngecek apakah request body lengkap apa engga
    // Kalo kurang lengkap, masuk ke catch degnan error message "Field cannot be empty 😠" (400)
    if (Object.keys(req.body).length < 4) {
      const error = new Error("Field cannot be empty 😠");
      error.statusCode = 400;
      throw error;
    }

    // Mengenkripsi password, membuat hash sebanyak 2^5 (32) iterasi
    const encryptPassword = await bcrypt.hash(password, 5);

    /*
      Masukkin user ke DB
      Ini sama aja kaya query:
      INSERT INTO nama_tabel (name, email, gender, password)
      VALUES (name, email, gender, encryptPassword);

      Setelah itu, simpan hasil query ke dalam variabel "newUsers"
      Hasil query berupa user baru yg telah berhasil dibuat
    */
    const newUser = await User.create({
      name: name,
      email: email,
      gender: gender,
      password: encryptPassword,
    });

    // Kalo berhasil ngirim respons sukses (201)
    return res.status(201).json({
      status: "Success",
      message: "User Registered",
      data: newUser,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      status: "Error",
      message: error.message,
    });
  }
}

// PUT USER
async function updateUser(req, res) {
  try {
    // Ambil name, email, gender, dan password dari requerst body
    let { password } = req.body;

    // Ngecek apakah field "password" udah diisi apa belom
    // Kalo udah, enkripsi password yang baru tadi
    if (password) {
      const encryptPassword = await bcrypt.hash(password, 5);
      password = encryptPassword;
    }

    // Ngecek apakah request body lengkap apa engga
    if (Object.keys(req.body).length < 4) {
      const error = new Error("Field cannot be empty 😠");
      error.statusCode = 400;
      throw error;
    }

    // Ngecek apakah id user yg diupdate ada apa ga
    const ifUserExist = await User.findOne({ where: { id: req.params.id } });

    // Kalo gada, masuk ke catch dengan message "User tidak ditemukan 😮" (400)
    if (!ifUserExist) {
      const error = new Error("User tidak ditemukan 😮");
      error.statusCode = 400;
      throw error;
    }

    /*
      Kalo ada, lakukan query update ke db
      Ini sama aja kaya query:
      UPDATE nama_tabel
      SET name = name, email = email, gender = gender, password = password
      WHERE id = id

      Keterangan:
      Nilai name, email, gender diambil dari req.body pake spread operator (...) biar gaperlu nulis ulang
      Nilai password diambil dari variabel "password"
      id diambil dari parameter dari endpoint.

      Hasil query berupa "row affected" disimpan ke dalam variabel "result"
    */
    const result = await User.update(
      { ...req.body, password },
      { where: { id: req.params.id } }
    );

    /*
      Cek apakah query berhasil atau engga
      Kalo gagal (tidak ada row yg affected), masuk ke catch,
      kasi message "Tidak ada data yang berubah" (400)
    */
    if (result[0] == 0) {
      const error = new Error("Tidak ada data yang berubah");
      error.statusCode = 400;
      throw error;
    }
    // Kalo berhasil, kirim respons sukses (200)
    else {
      return res.status(200).json({
        status: "Success",
        message: "User Updated",
      });
    }
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      status: "Error",
      message: error.message,
    });
  }
}

// DELETE USER
async function deleteUser(req, res) {
  try {
    // Ngecek apakah id user yg mau di-delete ada apa ga
    const ifUserExist = await User.findOne({ where: { id: req.params.id } });

    // Kalo gada, masuk ke catch dengan message "User tidak ditemukan 😮" (400)
    if (!ifUserExist) {
      const error = new Error("User tidak ditemukan 😮");
      error.statusCode = 400;
      throw error;
    }

    /*
      Kalo ada, lakukan query delete user berdasarkan id ke db
      Ini sama aja kaya DELETE FROM nama_tabel WHERE id = id
      id diambil dari parameter dari endpoint.

      Hasil query berupa row affected disimpan ke dalam variabel "result"
    */
    const result = await User.destroy({ where: { id: req.params.id } });

    /*
      Cek apakah query berhasil atau engga
      Kalo gagal (tidak ada row yg affected), masuk ke catch,
      kasi message "Tidak ada data yang berubah" (400)
    */
    if (result == 0) {
      const error = new Error("Tidak ada data yang berubah");
      error.statusCode = 400;
      throw error;
    }
    // Kalo berhasil, kirim respons sukses (200)
    else {
      return res.status(200).json({
        status: "Success",
        message: "User Deleted",
      });
    }
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      status: "Error",
      message: error.message,
    });
  }
}

// Fungsi LOGIN
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
        return res.status(200).json({
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
    return res.status(error.statusCode || 500).json({
      status: "Error",
      message: error.message,
    });
  }
}

// Fungsi LOGOUT
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
    return res.status(200).json({
      status: "Success",
      message: "Logout Berhasil",
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
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
