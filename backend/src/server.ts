import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import prisma from "./config/prisma.js";
import invoiceRoutes from "./routes/InvoiceRoutes.js";

dotenv.config();

const app = express();

const PORT =
  process.env.PORT || 5000;

app.use(
  cors({
    origin: "http://localhost:5173",
  })
);

app.use(express.json());

app.use(
  "/invoices",
  invoiceRoutes
);

app.get("/", (_req, res) => {
  res.json({
    success: true,
    message:
      "O-Pay Backend is running",
  });
});

app.get(
  "/health",
  async (_req, res) => {
    try {
      await prisma.$queryRaw`SELECT 1`;

      res.json({
        success: true,
        service:
          "O-Pay Backend",
        status: "healthy",
        database:
          "connected",
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        success: false,
        service:
          "O-Pay Backend",
        status:
          "unhealthy",
        database:
          "disconnected",
      });
    }
  }
);

app.listen(PORT, () => {
  console.log(
    `O-Pay Backend running on port ${PORT}`
  );
});