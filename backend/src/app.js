import express from "express";
import cors from "cors";
import morgan from "morgan";

import systemRoutes from "./routes/system-routes.js";
import employeesRoutes from "./routes/employees-routes.js";
import equipmentsRoutes from "./routes/equipments-routes.js";
import allocationsRoutes from "./routes/allocations-routes.js";
import { errorHandler, notFoundHandler } from "./middlewares/error-handler.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.use("/api", systemRoutes);
app.use("/api/employees", employeesRoutes);
app.use("/api/equipments", equipmentsRoutes);
app.use("/api/allocations", allocationsRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
