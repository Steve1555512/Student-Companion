"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { FaUser, FaEnvelope, FaLock, FaUniversity, FaCamera, FaSpinner } from "react-icons/fa";
import toast, { Toaster } from "react-hot-toast";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [faceCaptured, setFaceCaptured] = useState(false);
  const [faceImage, setFaceImage] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  const startCamera = async () => {
    try {
      // Stop any existing stream first
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(t => t.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play();
          setCameraActive(true);
        };
      }
    } catch {
      toast.error("Please allow camera access");
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(t => t.stop());
      setCameraActive(false);
    }
  };

  const captureFace = () => {
    if (!cameraActive) return toast.error("Camera not ready");
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = canvas.toDataURL("image/jpeg", 0.8);
    setFaceImage(imageData);
    setFaceCaptured(true);
    stopCamera();
    toast.success("Face captured! ✅");
  };

  const handleRetake = () => {
    setFaceCaptured(false);
    setFaceImage(null);
    setCameraActive(false);
    setTimeout(() => startCamera(), 300);
  };

  const handleSignup = () => {
    if (!name || !email || !password) return toast.error("Please fill all fields");
    if (password !== confirmPassword) return toast.error("Passwords do not match");
    if (password.length < 6) return toast.error("Password must be at least 6 characters");
    if (!faceCaptured) return toast.error("Please capture your face first!");

    setIsLoading(true);
    const users = JSON.parse(localStorage.getItem("users") || "[]");
    if (users.find(u => u.email === email)) {
      toast.error("Email already registered");
      setIsLoading(false);
      return;
    }

    users.push({ name, email, password, faceImage });
    localStorage.setItem("users", JSON.stringify(users));
    localStorage.setItem("currentUser", JSON.stringify({ name, email }));

    setTimeout(() => {
      toast.success("Account created successfully!");
      stopCamera();
      window.location.href = "/dashboard";
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-purple-900 via-indigo-900 to-slate-900">
      <Toaster position="top-center" />
      <canvas ref={canvasRef} className="hidden" />
      <div className="w-full max-w-2xl">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
          <div className="text-center mb-6">
            <div className="inline-block p-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 mb-3">
              <FaUniversity className="text-3xl text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">Create Account</h1>
            <p className="text-gray-300 text-sm">Join Student Companion System</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="relative">
                <FaUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="text" placeholder="Full Name" value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500" />
              </div>
              <div className="relative">
                <FaEnvelope className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="email" placeholder="University Email" value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500" />
              </div>
              <div className="relative">
                <FaLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="password" placeholder="Password (min 6 chars)" value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500" />
              </div>
              <div className="relative">
                <FaLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="password" placeholder="Confirm Password" value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500" />
              </div>
              <button onClick={handleSignup} disabled={isLoading}
                className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-semibold disabled:opacity-50">
                {isLoading ? "Creating Account..." : "Sign Up"}
              </button>
              <p className="text-gray-400 text-sm text-center">
                Already have an account? <Link href="/" className="text-purple-400 hover:underline">Login</Link>
              </p>
            </div>

            <div>
              <p className="text-white font-semibold mb-2">📸 Capture Your Face</p>
              <p className="text-gray-400 text-xs mb-3">This will be used to verify you during login</p>

              {faceCaptured ? (
                <div>
                  {faceImage ? (
                    <img src={faceImage} alt="captured face"
                      className="w-full h-48 object-cover rounded-xl border-2 border-green-500 mb-3" />
                  ) : (
                    <div className="w-full h-48 rounded-xl border-2 border-green-500 mb-3 bg-green-500/10 flex items-center justify-center">
                      <p className="text-green-300 text-sm">📸 Photo saved</p>
                    </div>
                  )}
                  <div className="p-3 bg-green-500/20 border border-green-500 rounded-lg text-center mb-3">
                    <p className="text-green-300 text-sm">✅ Face captured! Ready to sign up.</p>
                  </div>
                  <button onClick={handleRetake}
                    className="w-full py-2 bg-white/10 text-gray-300 rounded-lg text-sm hover:bg-white/20 transition">
                    🔄 Retake Photo
                  </button>
                </div>
              ) : (
                <div>
                  <div className="rounded-xl overflow-hidden border-2 border-white/20 mb-3">
                    <video ref={videoRef} autoPlay playsInline muted
                      className="w-full h-48 object-cover" style={{ transform: 'scaleX(-1)' }} />
                  </div>
                  <button onClick={captureFace} disabled={!cameraActive}
                    className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-semibold disabled:opacity-50">
                    {cameraActive ? <><FaCamera className="inline mr-2" />Capture Face</> : <><FaSpinner className="animate-spin inline mr-2" />Starting camera...</>}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}