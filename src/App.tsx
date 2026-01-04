import React, { useState, useEffect } from "react";
import { 
  Cpu, 
  Zap, 
  Database as DbIcon, 
  TrendingUp, 
  Plus, 
  RefreshCw, 
  Info,
  Layers,
  Monitor,
  HardDrive,
  Activity
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from "recharts";
import { motion, AnimatePresence } from "motion/react";
import { HardwareConfig, PerformanceMetrics, HardwareDataPoint } from "./types";
import { predictPerformance, generateSyntheticData } from "./services/geminiService";

const App: React.FC = () => {
  const [historicalData, setHistoricalData] = useState<HardwareDataPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [predicting, setPredicting] = useState(false);
  const [currentConfig, setCurrentConfig] = useState<HardwareConfig>({
    oem: "Samsung",
    board: "kalama",
    platform: "SM8550",
    platform_vendor: "Qualcomm",
    form_factor: "Smartphone",
    ram_gb: 12,
    storage_gb: 256,
    num_cores: 8,
    cpu_name: "Snapdragon 8 Gen 2",
    cpu_architecture: "arm64-v8a",
    cpu_clock_speed: 3.2,
    gpu_model: "Adreno 740",
    has_touchscreen: true,
    has_stylus: true,
    screen_size: 6.8,
    pixel_size: "3088x1440",
    battery_manufacturer: "Samsung SDI",
    usage_group: "Gaming"
  });
  const [prediction, setPrediction] = useState<PerformanceMetrics | null>(null);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [bulkJson, setBulkJson] = useState("");
  const [manualMetrics, setManualMetrics] = useState<PerformanceMetrics>({
    singleCoreScore: 1800,
    multiCoreScore: 5100,
    gpuScore: 9500,
    appLaunchSpeed: 9,
    thermalThrottling: 8
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/data");
      const data = await res.json();
      setHistoricalData(data);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePredict = async () => {
    setPredicting(true);
    try {
      const result = await predictPerformance(currentConfig, historicalData);
      setPrediction(result);
    } catch (error) {
      console.error("Prediction error:", error);
    } finally {
      setPredicting(false);
    }
  };

  const handleSave = async () => {
    if (!prediction) return;
    setLoading(true);
    try {
      await fetch("/api/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...currentConfig, ...prediction })
      });
      await fetchData();
    } catch (error) {
      console.error("Save error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSeed = async () => {
    setLoading(true);
    try {
      const synthetic = await generateSyntheticData();
      for (const item of synthetic) {
        await fetch("/api/data", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(item)
        });
      }
      await fetchData();
    } catch (error) {
      console.error("Seed error:", error);
    } finally {
      setLoading(false);
    }
  };

  const radarData = prediction ? [
    { subject: 'Single Core', A: prediction.singleCoreScore / 3000 * 100, fullMark: 100 },
    { subject: 'Multi Core', A: prediction.multiCoreScore / 10000 * 100, fullMark: 100 },
    { subject: 'GPU', A: prediction.gpuScore / 20000 * 100, fullMark: 100 },
    { subject: 'App Speed', A: prediction.appLaunchSpeed * 10, fullMark: 100 },
    { subject: 'Thermal', A: prediction.thermalThrottling * 10, fullMark: 100 },
  ] : [];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans p-4 md:p-8">
      <header className="max-w-7xl mx-auto mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3"
        >
          <div className="bg-blue-600 p-3 rounded-2xl shadow-lg shadow-blue-200">
            <Activity className="text-white w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-800">DroidPerf AI</h1>
            <p className="text-slate-500 font-medium">Advanced Hardware Performance Predictor</p>
          </div>
        </motion.div>

        <div className="flex gap-2">
          <button 
            onClick={() => setShowBulkImport(!showBulkImport)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all font-semibold text-slate-700 shadow-sm"
          >
            <DbIcon className="w-4 h-4" />
            Bulk Import
          </button>
          <button 
            onClick={() => setShowManualEntry(!showManualEntry)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all font-semibold text-slate-700 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            {showManualEntry ? "Hide Form" : "Add Real Sample"}
          </button>
          <button 
            onClick={handleSeed}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all font-semibold text-slate-700 shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Seed AI Data
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        <AnimatePresence>
          {showBulkImport && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="lg:col-span-12"
            >
              <div className="bg-slate-800 p-8 rounded-3xl mb-8 text-white shadow-2xl">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <DbIcon className="text-blue-400" />
                  Connect your SQL Data (JSON Import)
                </h3>
                <p className="text-slate-400 mb-4 text-sm">
                  Paste a JSON array of your hardware configurations and performance metrics. 
                  The AI will immediately use this data as context for all future predictions.
                </p>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-slate-500 uppercase">JSON Data</span>
                  <button 
                    onClick={() => {
                      const example = [{
                        oem: "Samsung",
                        board: "kalama",
                        platform: "SM8550",
                        platform_vendor: "Qualcomm",
                        form_factor: "Smartphone",
                        ram_gb: 12,
                        storage_gb: 256,
                        num_cores: 8,
                        cpu_name: "Snapdragon 8 Gen 2",
                        cpu_architecture: "arm64-v8a",
                        cpu_clock_speed: 3.2,
                        gpu_model: "Adreno 740",
                        has_touchscreen: true,
                        has_stylus: true,
                        screen_size: 6.8,
                        pixel_size: "3088x1440",
                        battery_manufacturer: "Samsung SDI",
                        usage_group: "Gaming",
                        singleCoreScore: 1800,
                        multiCoreScore: 5100,
                        gpuScore: 9500,
                        appLaunchSpeed: 9,
                        thermalThrottling: 8
                      }];
                      setBulkJson(JSON.stringify(example, null, 2));
                    }}
                    className="text-xs font-bold text-blue-400 hover:text-blue-300"
                  >
                    Load Example Template
                  </button>
                </div>
                <textarea 
                  className="w-full h-48 bg-slate-900 border border-slate-700 rounded-2xl p-4 font-mono text-xs text-blue-300 focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder='[{"oem": "Samsung", "cpu_name": "Snapdragon 8 Gen 2", "singleCoreScore": 1800, ...}]'
                  value={bulkJson}
                  onChange={e => setBulkJson(e.target.value)}
                />
                <div className="flex justify-end gap-3 mt-4">
                  <button onClick={() => setShowBulkImport(false)} className="px-6 py-2 rounded-xl font-bold text-slate-400 hover:text-white transition-colors">Cancel</button>
                  <button 
                    onClick={async () => {
                      try {
                        const data = JSON.parse(bulkJson);
                        setLoading(true);
                        const res = await fetch("/api/data/bulk", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify(data)
                        });
                        
                        if (res.ok) {
                          await fetchData();
                          setShowBulkImport(false);
                          setBulkJson("");
                          alert("Data synced successfully!");
                        } else {
                          const err = await res.json();
                          alert(`Import failed: ${err.error || "Unknown error"}`);
                        }
                      } catch (e: any) {
                        alert(`Error: ${e.message || "Invalid JSON format. Please check your data."}`);
                      } finally {
                        setLoading(false);
                      }
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-2 rounded-xl shadow-lg shadow-blue-900/20 transition-all"
                  >
                    Sync with AI System
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showManualEntry && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:col-span-12 overflow-hidden"
            >
              <div className="bg-blue-50 border border-blue-100 p-6 rounded-3xl mb-8">
                <h3 className="text-lg font-bold text-blue-800 mb-4 flex items-center gap-2">
                  <DbIcon className="w-5 h-5" />
                  Feed Real Sample to System
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-blue-600 mb-1">Single Core</label>
                    <input type="number" className="w-full bg-white border border-blue-200 rounded-lg px-3 py-2" value={manualMetrics.singleCoreScore} onChange={e => setManualMetrics({...manualMetrics, singleCoreScore: parseInt(e.target.value)})} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-blue-600 mb-1">Multi Core</label>
                    <input type="number" className="w-full bg-white border border-blue-200 rounded-lg px-3 py-2" value={manualMetrics.multiCoreScore} onChange={e => setManualMetrics({...manualMetrics, multiCoreScore: parseInt(e.target.value)})} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-blue-600 mb-1">GPU Score</label>
                    <input type="number" className="w-full bg-white border border-blue-200 rounded-lg px-3 py-2" value={manualMetrics.gpuScore} onChange={e => setManualMetrics({...manualMetrics, gpuScore: parseInt(e.target.value)})} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-blue-600 mb-1">App Speed (1-10)</label>
                    <input type="number" className="w-full bg-white border border-blue-200 rounded-lg px-3 py-2" value={manualMetrics.appLaunchSpeed} onChange={e => setManualMetrics({...manualMetrics, appLaunchSpeed: parseInt(e.target.value)})} />
                  </div>
                  <div className="flex items-end">
                    <button 
                      onClick={async () => {
                        setLoading(true);
                        await fetch("/api/data", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ ...currentConfig, ...manualMetrics })
                        });
                        await fetchData();
                        setShowManualEntry(false);
                      }}
                      className="w-full bg-blue-600 text-white font-bold py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Save Sample
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Left Column: Configuration Form */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-4 space-y-6"
        >
          <div className="bg-white p-6 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100">
            <div className="flex items-center gap-2 mb-6">
              <Layers className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-bold">Hardware Config</h2>
            </div>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1 uppercase">OEM</label>
                  <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm" value={currentConfig.oem} onChange={e => setCurrentConfig({...currentConfig, oem: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1 uppercase">Board</label>
                  <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm" value={currentConfig.board} onChange={e => setCurrentConfig({...currentConfig, board: e.target.value})} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1 uppercase">Platform</label>
                  <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm" value={currentConfig.platform} onChange={e => setCurrentConfig({...currentConfig, platform: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1 uppercase">Vendor</label>
                  <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm" value={currentConfig.platform_vendor} onChange={e => setCurrentConfig({...currentConfig, platform_vendor: e.target.value})} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1 uppercase">Form Factor</label>
                <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm" value={currentConfig.form_factor} onChange={e => setCurrentConfig({...currentConfig, form_factor: e.target.value})}>
                  <option>Smartphone</option>
                  <option>Tablet</option>
                  <option>Foldable</option>
                  <option>Desktop (Android)</option>
                  <option>Automotive</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1 uppercase">RAM (GB)</label>
                  <input type="number" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm" value={currentConfig.ram_gb} onChange={e => setCurrentConfig({...currentConfig, ram_gb: parseInt(e.target.value)})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1 uppercase">Storage (GB)</label>
                  <input type="number" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm" value={currentConfig.storage_gb} onChange={e => setCurrentConfig({...currentConfig, storage_gb: parseInt(e.target.value)})} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1 uppercase">CPU Name</label>
                <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm" value={currentConfig.cpu_name} onChange={e => setCurrentConfig({...currentConfig, cpu_name: e.target.value})} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1 uppercase">Cores</label>
                  <input type="number" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm" value={currentConfig.num_cores} onChange={e => setCurrentConfig({...currentConfig, num_cores: parseInt(e.target.value)})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1 uppercase">Clock (GHz)</label>
                  <input type="number" step="0.1" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm" value={currentConfig.cpu_clock_speed} onChange={e => setCurrentConfig({...currentConfig, cpu_clock_speed: parseFloat(e.target.value)})} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1 uppercase">GPU Model</label>
                <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm" value={currentConfig.gpu_model} onChange={e => setCurrentConfig({...currentConfig, gpu_model: e.target.value})} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2 py-2">
                  <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" checked={currentConfig.has_touchscreen} onChange={e => setCurrentConfig({...currentConfig, has_touchscreen: e.target.checked})} />
                  <label className="text-xs font-bold text-slate-600 uppercase">Touchscreen</label>
                </div>
                <div className="flex items-center gap-2 py-2">
                  <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" checked={currentConfig.has_stylus} onChange={e => setCurrentConfig({...currentConfig, has_stylus: e.target.checked})} />
                  <label className="text-xs font-bold text-slate-600 uppercase">Stylus</label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1 uppercase">Screen Size</label>
                  <input type="number" step="0.1" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm" value={currentConfig.screen_size} onChange={e => setCurrentConfig({...currentConfig, screen_size: parseFloat(e.target.value)})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1 uppercase">Pixel Size</label>
                  <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm" value={currentConfig.pixel_size} onChange={e => setCurrentConfig({...currentConfig, pixel_size: e.target.value})} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1 uppercase">Battery Manufacturer</label>
                <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm" value={currentConfig.battery_manufacturer} onChange={e => setCurrentConfig({...currentConfig, battery_manufacturer: e.target.value})} />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1 uppercase">Usage Pattern</label>
                <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm" value={currentConfig.usage_group} onChange={e => setCurrentConfig({...currentConfig, usage_group: e.target.value})}>
                  <option>Gaming</option>
                  <option>Office Work</option>
                  <option>Video Editing</option>
                  <option>Web Browsing</option>
                  <option>Power Saving</option>
                  <option>Development</option>
                </select>
              </div>
            </div>

            <button 
              onClick={handlePredict}
              disabled={predicting}
              className="w-full mt-6 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-2xl shadow-lg shadow-blue-200 transition-all active:scale-95 disabled:opacity-50"
            >
              {predicting ? <RefreshCw className="animate-spin" /> : <Zap className="w-5 h-5" />}
              {predicting ? "Predicting..." : "Predict Performance"}
            </button>
          </div>
        </motion.section>

        {/* Middle Column: Prediction & Visualization */}
        <motion.section 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-8 space-y-8"
        >
          {prediction ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                    <h2 className="text-xl font-bold">AI Prediction</h2>
                  </div>
                  <button 
                    onClick={handleSave}
                    className="flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-700"
                  >
                    <Plus className="w-4 h-4" />
                    Learn this config
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <p className="text-xs font-bold text-slate-500 uppercase">Single Core</p>
                    <p className="text-2xl font-black text-slate-800">{prediction.singleCoreScore}</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <p className="text-xs font-bold text-slate-500 uppercase">Multi Core</p>
                    <p className="text-2xl font-black text-slate-800">{prediction.multiCoreScore}</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <p className="text-xs font-bold text-slate-500 uppercase">GPU Score</p>
                    <p className="text-2xl font-black text-slate-800">{prediction.gpuScore}</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <p className="text-xs font-bold text-slate-500 uppercase">App Launch</p>
                    <p className="text-2xl font-black text-slate-800">{prediction.appLaunchSpeed}/10</p>
                  </div>
                </div>

                <div className="mt-6 h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="subject" />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} />
                      <Radar name="Prediction" dataKey="A" stroke="#2563eb" fill="#3b82f6" fillOpacity={0.6} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100">
                <div className="flex items-center gap-2 mb-6">
                  <Monitor className="w-5 h-5 text-purple-600" />
                  <h2 className="text-xl font-bold">Comparison</h2>
                </div>
                <div className="h-full max-h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={historicalData.slice(0, 5)}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="cpu_name" hide />
                      <YAxis />
                      <Tooltip 
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      />
                      <Legend />
                      <Bar dataKey="multiCoreScore" name="Multi Core" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="gpuScore" name="GPU Score" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white p-12 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col items-center justify-center text-center">
              <div className="bg-slate-50 p-6 rounded-full mb-4">
                <Info className="w-12 h-12 text-slate-300" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-2">No Prediction Yet</h3>
              <p className="text-slate-500 max-w-md">
                Configure the hardware on the left and click "Predict Performance" to see how the AI evaluates the configuration.
              </p>
            </div>
          )}

          {/* Historical Data Table */}
          <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DbIcon className="w-5 h-5 text-slate-600" />
                <h2 className="text-xl font-bold">Learned Configurations</h2>
              </div>
              <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-black">
                {historicalData.length} SAMPLES
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-500 text-xs font-black uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Hardware</th>
                    <th className="px-6 py-4">RAM/Storage</th>
                    <th className="px-6 py-4">Scores (S/M/G)</th>
                    <th className="px-6 py-4">Efficiency</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <AnimatePresence>
                    {historicalData.map((data, idx) => (
                      <motion.tr 
                        key={data.id || idx}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="hover:bg-slate-50/50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-800">{data.cpu_name}</span>
                            <span className="text-xs text-slate-500">{data.gpu_model}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">{data.ram_gb}GB RAM</span>
                            <span className="text-xs text-slate-500">{data.usage_group}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-bold">{data.singleCoreScore}</span>
                            <span className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded text-xs font-bold">{data.multiCoreScore}</span>
                            <span className="bg-purple-50 text-purple-700 px-2 py-1 rounded text-xs font-bold">{data.gpuScore}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="w-24 bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div 
                              className="bg-green-500 h-full" 
                              style={{ width: `${(data.thermalThrottling / 10) * 100}%` }}
                            />
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </div>
        </motion.section>
      </main>
    </div>
  );
};

export default App;
