import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = new Database("hardware_performance.db");

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS hardware_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    oem TEXT,
    board TEXT,
    platform TEXT,
    platform_vendor TEXT,
    form_factor TEXT,
    ram_gb INTEGER,
    storage_gb INTEGER,
    num_cores INTEGER,
    cpu_name TEXT,
    cpu_architecture TEXT,
    cpu_clock_speed REAL,
    gpu_model TEXT,
    has_touchscreen INTEGER,
    has_stylus INTEGER,
    screen_size REAL,
    pixel_size TEXT,
    battery_manufacturer TEXT,
    usage_group TEXT,
    singleCoreScore INTEGER,
    multiCoreScore INTEGER,
    gpuScore INTEGER,
    appLaunchSpeed REAL,
    thermalThrottling REAL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/data", (req, res) => {
    const rows = db.prepare("SELECT * FROM hardware_data ORDER BY timestamp DESC").all();
    // Convert 0/1 back to boolean for the frontend
    const formattedRows = rows.map((row: any) => ({
      ...row,
      has_touchscreen: !!row.has_touchscreen,
      has_stylus: !!row.has_stylus
    }));
    res.json(formattedRows);
  });

  app.post("/api/data", (req, res) => {
    const {
      oem, board, platform, platform_vendor, form_factor, ram_gb, storage_gb, num_cores,
      cpu_name, cpu_architecture, cpu_clock_speed, gpu_model, has_touchscreen, has_stylus,
      screen_size, pixel_size, battery_manufacturer, usage_group,
      singleCoreScore, multiCoreScore, gpuScore, appLaunchSpeed, thermalThrottling
    } = req.body;

    const stmt = db.prepare(`
      INSERT INTO hardware_data (
        oem, board, platform, platform_vendor, form_factor, ram_gb, storage_gb, num_cores,
        cpu_name, cpu_architecture, cpu_clock_speed, gpu_model, has_touchscreen, has_stylus,
        screen_size, pixel_size, battery_manufacturer, usage_group,
        singleCoreScore, multiCoreScore, gpuScore, appLaunchSpeed, thermalThrottling
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      oem, board, platform, platform_vendor, form_factor, ram_gb, storage_gb, num_cores,
      cpu_name, cpu_architecture, cpu_clock_speed, gpu_model, has_touchscreen ? 1 : 0, has_stylus ? 1 : 0,
      screen_size, pixel_size, battery_manufacturer, usage_group,
      singleCoreScore, multiCoreScore, gpuScore, appLaunchSpeed, thermalThrottling
    );

    res.json({ id: result.lastInsertRowid });
  });

  app.post("/api/data/bulk", (req, res) => {
    try {
      const samples = req.body;
      if (!Array.isArray(samples)) return res.status(400).json({ error: "Expected an array of objects." });

      const insert = db.prepare(`
        INSERT INTO hardware_data (
          oem, board, platform, platform_vendor, form_factor, ram_gb, storage_gb, num_cores,
          cpu_name, cpu_architecture, cpu_clock_speed, gpu_model, has_touchscreen, has_stylus,
          screen_size, pixel_size, battery_manufacturer, usage_group,
          singleCoreScore, multiCoreScore, gpuScore, appLaunchSpeed, thermalThrottling
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const insertMany = db.transaction((data) => {
        for (const s of data) {
          insert.run(
            s.oem || "Unknown", 
            s.board || "Unknown", 
            s.platform || "Unknown", 
            s.platform_vendor || "Unknown", 
            s.form_factor || "Smartphone", 
            s.ram_gb || 0, 
            s.storage_gb || 0, 
            s.num_cores || 0,
            s.cpu_name || "Unknown", 
            s.cpu_architecture || "Unknown", 
            s.cpu_clock_speed || 0, 
            s.gpu_model || "Unknown", 
            s.has_touchscreen ? 1 : 0, 
            s.has_stylus ? 1 : 0,
            s.screen_size || 0, 
            s.pixel_size || "Unknown", 
            s.battery_manufacturer || "Unknown", 
            s.usage_group || "General",
            s.singleCoreScore || 0, 
            s.multiCoreScore || 0, 
            s.gpuScore || 0, 
            s.appLaunchSpeed || 0, 
            s.thermalThrottling || 0
          );
        }
      });

      insertMany(samples);
      res.json({ success: true, count: samples.length });
    } catch (error: any) {
      console.error("Bulk import error:", error);
      res.status(500).json({ error: error.message || "Internal server error during import." });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
