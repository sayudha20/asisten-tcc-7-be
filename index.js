import express from "express";
import cors from "cors";
import UserRoute from "./routes/UserRoute.js";
import "dotenv/config";
import cookieParser from "cookie-parser";

const app = express();
app.set("view engine", "ejs");

app.use(cookieParser());
app.use(
  cors({
    origin: "http://localhost:3000", // <- Diganti sama alamat front-end
    credentials: true,
  })
);
app.use(express.json());
app.get("/", (req, res) => res.render("index"));
app.use(UserRoute);

app.listen(5000, () => console.log("Server connected"));
