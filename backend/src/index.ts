import dotenv from "dotenv";
import { connectDB } from "./config/db";
import { createApp } from "./app";
import { setupCronJobs } from "./utils/cronJobs";

dotenv.config();

const startServer = async () => {
  try {
    await connectDB();
    const { server } = createApp();
    const PORT = process.env.PORT || 5000;

    setupCronJobs();

    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
