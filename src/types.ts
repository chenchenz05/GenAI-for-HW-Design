export interface HardwareConfig {
  id?: number;
  oem: string;
  board: string;
  platform: string;
  platform_vendor: string;
  form_factor: string;
  ram_gb: number;
  storage_gb: number;
  num_cores: number;
  cpu_name: string;
  cpu_architecture: string;
  cpu_clock_speed: number; // in GHz
  gpu_model: string;
  has_touchscreen: boolean;
  has_stylus: boolean;
  screen_size: number; // inches
  pixel_size: string; // e.g., 2560x1440
  battery_manufacturer: string;
  usage_group: string; // e.g., Gaming, Office, Video Editing, Power Saving
}

export interface PerformanceMetrics {
  singleCoreScore: number;
  multiCoreScore: number;
  gpuScore: number;
  appLaunchSpeed: number; // 1-10 scale
  thermalThrottling: number; // 1-10 scale
}

export interface HardwareDataPoint extends HardwareConfig {
  metrics: PerformanceMetrics;
  timestamp: string;
}
