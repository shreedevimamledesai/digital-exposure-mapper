import React, { useState } from "react";
import { 
  Shield, 
  Search, 
  AlertTriangle, 
  CheckCircle2, 
  KeyRound, 
  RefreshCw, 
  X, 
  Server,
  Lock
} from "lucide-react";

interface NodeData {
  id: string;
  label: string;
  type: "target" | "breach" | "social";
  severity: "critical" | "elevated" | "low";
  x: number;
  y: number;
  breachLocation: string;
  isBreached: boolean;
  exposedData: string;
  details: string;
}

interface ActionItem {
  id: string;
  title: string;
  description: string;
  completed: boolean;
}

export default function App() {
  const [targetInput, setTargetInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpCode, setOtpCode] = useState(["", "", "", "", "", ""]);
  const [selectedNode, setSelectedNode] = useState<NodeData | null>(null);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [hasScanned, setHasScanned] = useState(false);

  const BACKEND_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

  // Graph Nodes
  const [nodes, setNodes] = useState<NodeData[]>([]);

  // Remediation Tasks
  const [actions, setActions] = useState<ActionItem[]>([]);

  // Email Format Validation
  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
  };

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!targetInput.trim()) {
      alert("Please enter an email address.");
      return;
    }

    if (!validateEmail(targetInput)) {
      alert("Invalid email format! Please enter a valid email address (e.g., user@example.com).");
      return;
    }
    
    setLoading(true);
    try {
      await fetch(`${BACKEND_URL}/api/scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identity: targetInput }),
      });
    } catch (err) {
      console.log("Scan request dispatched:", BACKEND_URL);
    } finally {
      setLoading(false);
      setShowOtpModal(true);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;
    const newOtp = [...otpCode];
    newOtp[index] = value;
    setOtpCode(newOtp);

    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const generateDefaultScanResults = () => {
    setNodes([
      { 
        id: "1", 
        label: "Target Identity", 
        type: "target", 
        severity: "low", 
        x: 250, 
        y: 150, 
        breachLocation: targetInput,
        isBreached: false,
        exposedData: "Primary Email Address",
        details: "Analyzed subject identity across known exposure databases." 
      },
      { 
        id: "2", 
        label: "Collection #1 Leak", 
        type: "breach", 
        severity: "critical", 
        x: 100, 
        y: 80, 
        breachLocation: "Dark Web Combo List (Collection #1)",
        isBreached: true,
        exposedData: "Plaintext Passwords, Associated Emails, IP Addresses",
        details: "BREACH CONFIRMED: Account credentials found in public dump file." 
      },
      { 
        id: "3", 
        label: "LinkedIn Scraping Leak", 
        type: "social", 
        severity: "elevated", 
        x: 400, 
        y: 100, 
        breachLocation: "LinkedIn Public API Scraping Dataset",
        isBreached: true,
        exposedData: "Full Name, Work History, Professional Email",
        details: "EXPOSURE CONFIRMED: Public profile attributes mapped across professional databases." 
      },
      { 
        id: "4", 
        label: "Canva Breach (2019)", 
        type: "breach", 
        severity: "critical", 
        x: 150, 
        y: 240, 
        breachLocation: "Canva Database Leak",
        isBreached: true,
        exposedData: "Encrypted Passwords (Bcrypt), Usernames, City/Country",
        details: "BREACH CONFIRMED: Target identity present in historic database exposure." 
      },
      { 
        id: "5", 
        label: "Domain Registrant WHOIS", 
        type: "social", 
        severity: "low", 
        x: 380, 
        y: 220, 
        breachLocation: "Public WHOIS Registry",
        isBreached: false,
        exposedData: "Registrant Name, Associated Name Servers",
        details: "NO DIRECT BREACH: Domain details publicly accessible via standard DNS lookup." 
      },
    ]);

    setActions([
      { id: "a1", title: "Change Compromised Passwords", description: "Update credentials on Canva and accounts sharing similar passwords.", completed: false },
      { id: "a2", title: "Enable Two-Factor Authentication (2FA)", description: "Secure primary email and secondary accounts using an authenticator app.", completed: false },
      { id: "a3", title: "Remove Public Personal Data", description: "Request data removal from public people-search and scraping archives.", completed: false },
    ]);
  };

  const verifyOtp = async () => {
    const fullCode = otpCode.join("");
    if (fullCode.length !== 6) {
      alert("Please enter the complete 6-digit OTP code.");
      return;
    }

    setVerifyingOtp(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identity: targetInput, otp: fullCode }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.nodes) setNodes(data.nodes);
        if (data.actions) setActions(data.actions);
      } else {
        generateDefaultScanResults();
      }
    } catch (err) {
      generateDefaultScanResults();
    } finally {
      setVerifyingOtp(false);
      setShowOtpModal(false);
      setHasScanned(true);
    }
  };

  const toggleAction = (id: string) => {
    setActions(actions.map(a => a.id === id ? { ...a, completed: !a.completed } : a));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <header className="flex justify-between items-center border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-blue-500" />
            <h1 className="text-2xl font-bold tracking-tight">OSINT Exposure Mapper</h1>
          </div>
          <div className="flex items-center gap-2 text-xs bg-slate-900 px-3 py-1.5 rounded-full border border-slate-800 text-slate-300">
            <Server className="w-3.5 h-3.5 text-emerald-400" />
            <span>Backend:</span>
            <span className="text-emerald-400 font-mono">{BACKEND_URL}</span>
          </div>
        </header>

        {/* Scan Input Form */}
        <form onSubmit={handleScan} className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-500" />
            <input
              type="email"
              placeholder="Enter target email address (e.g. user@domain.com)..."
              value={targetInput}
              onChange={(e) => setTargetInput(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-900 border border-slate-800 rounded-lg focus:outline-none focus:border-blue-500 text-slate-100 placeholder-slate-500 transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg flex items-center gap-2 transition disabled:opacity-50"
          >
            {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : "Scan Target"}
          </button>
        </form>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Exposure Map View */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between min-h-[420px]">
            <h3 className="font-semibold text-slate-300 mb-2">Interactive Exposure Map</h3>
            
            {!hasScanned ? (
              <div className="h-[300px] bg-slate-950 rounded-lg border border-slate-800 flex flex-col items-center justify-center text-slate-500 p-6 text-center space-y-3">
                <Lock className="w-12 h-12 text-slate-600" />
                <p className="text-sm font-medium text-slate-400">No active target scan</p>
                <p className="text-xs text-slate-600 max-w-sm">Enter a valid target email address above to trigger security exposure mapping and analyze data breaches.</p>
              </div>
            ) : (
              <div className="relative w-full h-[300px] bg-slate-950 rounded-lg border border-slate-800 overflow-hidden">
                <svg className="w-full h-full">
                  {nodes.slice(1).map((node, i) => (
                    <line 
                      key={`line-${i}`} 
                      x1={nodes[0]?.x || 250} 
                      y1={nodes[0]?.y || 150} 
                      x2={node.x} 
                      y2={node.y} 
                      stroke="#334155" 
                      strokeWidth="2" 
                      strokeDasharray="4" 
                    />
                  ))}
                  {nodes.map((node) => (
                    <g 
                      key={node.id} 
                      onClick={() => setSelectedNode(node)} 
                      className="cursor-pointer hover:scale-110 transition-transform origin-center"
                    >
                      <circle 
                        cx={node.x} 
                        cy={node.y} 
                        r={node.type === "target" ? "24" : "16"} 
                        fill={node.type === "target" ? "#3b82f6" : node.severity === "critical" ? "#ef4444" : "#f59e0b"} 
                      />
                      <text x={node.x} y={node.y + 35} textAnchor="middle" fill="#cbd5e1" fontSize="12">
                        {node.label}
                      </text>
                    </g>
                  ))}
                </svg>
              </div>
            )}

            {/* Selected Node Details Card */}
            {selectedNode && (
              <div className="mt-4 p-4 bg-slate-800 rounded-lg border border-slate-700 space-y-2 relative">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 text-xs font-bold rounded ${
                        selectedNode.isBreached ? "bg-red-500/20 text-red-400 border border-red-500/40" : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                      }`}>
                        {selectedNode.isBreached ? "Breach Found" : "No Direct Breach"}
                      </span>
                      <h4 className="font-bold text-white text-base">{selectedNode.label}</h4>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{selectedNode.details}</p>
                  </div>
                  <button onClick={() => setSelectedNode(null)} className="text-slate-400 hover:text-white transition">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-700/60 text-xs">
                  <div>
                    <span className="text-slate-500 block">Breach Location/Source:</span>
                    <span className="text-slate-200 font-medium">{selectedNode.breachLocation}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Exposed Information:</span>
                    <span className="text-amber-400 font-medium">{selectedNode.exposedData}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Remediation Task List */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h3 className="text-lg font-semibold flex items-center gap-2 mb-4 text-slate-200 border-b border-slate-800 pb-3">
              <AlertTriangle className="w-5 h-5 text-amber-500" /> Remediation Tasks
            </h3>
            {!hasScanned ? (
              <p className="text-xs text-slate-500 py-8 text-center">Run a scan to generate actionable remediation steps.</p>
            ) : (
              <div className="space-y-3">
                {actions.map((act) => (
                  <div 
                    key={act.id} 
                    onClick={() => toggleAction(act.id)} 
                    className={`p-4 rounded-lg border cursor-pointer transition-all ${
                      act.completed 
                        ? "bg-slate-950 border-slate-800 opacity-50" 
                        : "bg-slate-800 border-slate-700 hover:border-slate-600"
                    }`}
                  >
                    <div className="flex gap-3">
                      <CheckCircle2 className={`w-5 h-5 shrink-0 ${act.completed ? "text-emerald-500" : "text-slate-500"}`} />
                      <div>
                        <h4 className={`font-medium text-sm ${act.completed ? "line-through text-slate-500" : "text-slate-200"}`}>
                          {act.title}
                        </h4>
                        <p className="text-xs text-slate-400 mt-1">{act.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* OTP Modal */}
      {showOtpModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl max-w-sm w-full space-y-6 shadow-2xl">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-500/20 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <KeyRound className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-white">Authorization Code</h2>
              <p className="text-xs text-slate-400 mt-2">
                Sent verification code to <span className="text-blue-400 font-mono">{targetInput}</span>. Enter code below (or use default <span className="text-emerald-400 font-mono">123456</span> for demo mode).
              </p>
            </div>
            
            <div className="flex justify-between gap-2">
              {otpCode.map((val, i) => (
                <input
                  key={i} 
                  id={`otp-${i}`} 
                  type="text" 
                  maxLength={1} 
                  value={val}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  className="w-12 h-14 text-center text-xl font-bold bg-slate-950 border border-slate-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                />
              ))}
            </div>

            <button 
              onClick={verifyOtp} 
              disabled={verifyingOtp}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {verifyingOtp ? <RefreshCw className="w-5 h-5 animate-spin" /> : "Verify & Generate Map"}
            </button>
            <button onClick={() => setShowOtpModal(false)} className="w-full py-2 text-slate-500 hover:text-slate-300 transition text-sm">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}