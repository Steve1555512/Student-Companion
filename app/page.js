"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { FaCamera, FaSpinner, FaCheckCircle, FaUniversity, FaEnvelope, FaLock } from "react-icons/fa";
import toast, { Toaster } from "react-hot-toast";

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isFaceVerified, setIsFaceVerified] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraPermission, setCameraPermission] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const videoRef = useRef(null);

  // Auto-start camera when component mounts
  useEffect(() => {
    startCamera();
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play();
          setCameraActive(true);
          setCameraPermission(true);
          toast.success("Camera ready! Your face is showing.");
        };
      }
    } catch (error) {
      console.error("Camera error:", error);
      setCameraPermission(false);
      toast.error("Please allow camera access and refresh.");
    }
  };

  const verifyFace = () => {
    if (!cameraActive) {
      toast.error("Camera not ready. Please allow camera access.");
      return;
    }
    
    setIsLoading(true);
    setTimeout(() => {
      setIsFaceVerified(true);
      toast.success("Face verified successfully!");
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 1500);
      setIsLoading(false);
    }, 2000);
  };

 const handleEmailLogin = (e) => {
  e.preventDefault();
  if (!email || !password) {
    toast.error("Enter email and password");
    return;
  }
  
  // Check if user exists
  const users = JSON.parse(localStorage.getItem("users") || "[]");
  const user = users.find(u => u.email === email && u.password === password);
  
  if (!user) {
    toast.error("Invalid email or password. Please sign up first!");
    return;
  }
  
  setIsLoading(true);
  localStorage.setItem("currentUser", JSON.stringify({ name: user.name, email: user.email }));
  setTimeout(() => {
    toast.success(`Welcome back, ${user.name}!`);
    window.location.href = "/dashboard";
    setIsLoading(false);
  }, 1000);
};

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Toaster position="top-center" />
      
      <div className="w-full max-w-6xl">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="inline-block p-4 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 mb-4">
              <FaUniversity className="text-4xl text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-2">Student Companion System</h1>
            <p className="text-gray-300">Your All-in-One Academic Success Platform</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Email Login Section */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-4"> Email Login</h2>
              <form onSubmit={handleEmailLogin} className="space-y-4">
                <input
                  type="email"
                  placeholder="University Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                  required
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                  required
                />
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transition"
                >
                  {isLoading ? <FaSpinner className="animate-spin inline mr-2" /> : "Login"}
                </button>
              </form>
              <p className="text-gray-400 text-xs text-center mt-4">Demo: any email & password works</p>
            </div>

            {/* Face Verification Section */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-4"> Face Verification</h2>
              
              {/* Camera Box - ALWAYS VISIBLE */}
              <div className="rounded-xl overflow-hidden bg-black border-2 border-green-500 mb-4">
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  muted
                  className="w-full h-80 object-cover"
                  style={{ transform: 'scaleX(-1)' }}
                />
              </div>
              
              {/* Camera Status */}
              <div className="text-center mb-4">
                {cameraActive ? (
                  <p className="text-green-400 text-sm flex items-center justify-center gap-2">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                    Camera Active - Your face is visible
                  </p>
                ) : cameraPermission === false ? (
                  <p className="text-red-400 text-sm">Camera blocked. Please allow camera access.</p>
                ) : (
                  <p className="text-yellow-400 text-sm flex items-center justify-center gap-2">
                    <FaSpinner className="animate-spin" />
                    Starting camera...
                  </p>
                )}
              </div>
              
              <button
                onClick={verifyFace}
                disabled={isLoading || !cameraActive}
                className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-semibold hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? <FaSpinner className="animate-spin inline mr-2" /> : " Verify Face"}

                
              </button>

              <button>
                <p className="text-gray-400 text-xs text-center mt-4">
  Don't have an account? <Link href="/signup" className="text-purple-400 hover:underline">Sign Up</Link>
</p>
              </button>
              
              {isFaceVerified && (
                <div className="mt-4 p-3 bg-green-500/20 border border-green-500 rounded-lg text-center">
                  <FaCheckCircle className="inline text-green-500 mr-2" />
                  <span className="text-green-300">Verified! Redirecting...</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}