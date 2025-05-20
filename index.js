import express from "express";
import DBConnect from "./config/DBConfig.js";
import dotenv from "dotenv";
import Student from "./view/StudentRoute.js";
import Admin from "./view/AdminRoute.js";
import Question from "./view/ExamQuestion.js";
import cors from "cors";
import cookieParser from "cookie-parser";

dotenv.config();

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

app.use(
  cors({
    origin: [
      "https://institute-website-snowy.vercel.app",
      "http://localhost:5173",
      "https://insitute.vercel.app",
      "https://insitute-raminstitute-exams-projects.vercel.app"
    ],
    credentials: true
  })
);

// Routes
app.use("/Student", Student);
app.use("/Admin", Admin);
app.use("/Question", Question);

// Default Route
app.get("/", (req, res) => {
  res.send("Running backend");
});

// Start Server
const PORT = process.env.PORT || 6000;
app.listen(PORT, () => {
  console.log(`Server running on PORT ${PORT}`);
  DBConnect();
});
