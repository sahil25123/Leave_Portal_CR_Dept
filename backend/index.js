import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.routes.js";
import leaveRoutes from "./routes/leave.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import holidayRoutes from "./routes/holiday.routes.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/leave", leaveRoutes);
app.use("/api", adminRoutes);
app.use("/api", holidayRoutes);

app.get("/", (req, res) => {
  res.send("API Running...");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log("Server running on port " + PORT));
