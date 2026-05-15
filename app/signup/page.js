"use client";
import { useState } from "react";
import Link from "next/link";
import { FaUser, FaEnvelope, FaLock, FaUniversity } from "react-icons/fa";
import toast, { Toaster } from "react-hot-toast";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSignup = (e) => {
    e.preventDefault();
    
    if (!name || !email || !password) {
      toast.error("Please fill all fields");
      return;
    }
    
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    
    setIsLoading(true);
    
    // Save user to localStorage
    const users = JSON.parse(localStorage.getItem("users") || "[]");
    
    if (users.find(u => u.email === email)) {
      toast.error("Email already registered");
      setIsLoading(false);
      return;
    }
    
    users.push({ name, email, password });
    localStorage.setItem("users", JSON.stringify(users));
    localStorage.setItem("currentUser", JSON.stringify({ name, email }));
    
    setTimeout(() => {
      toast.success("Account created successfully!");
      window.location.href = "/dashboard";
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-purple-900 via-indigo-900 to-slate-900">
      <Toaster position="top-center" />
      
      <div className="w-full max-w-md">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
          <div className="text-center mb-6">
            <div className="inline-block p-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 mb-3">
              <FaUniversity className="text-3xl text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">Create Account</h1>
            <p className="text-gray-300 text-sm">Join Student Companion System</p>
          </div>

          <form onSubmit={handleSignup} className="space-y-4">
            <div className="relative">
              <FaUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500" required />
            </div>
            <div className="relative">
              <FaEnvelope className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input type="email" placeholder="University Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500" required />
            </div>
            <div className="relative">
              <FaLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input type="password" placeholder="Password (min 6 characters)" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500" required />
            </div>
            <div className="relative">
              <FaLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input type="password" placeholder="Confirm Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500" required />
            </div>
            <button type="submit" disabled={isLoading} className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transition">
              {isLoading ? "Creating Account..." : "Sign Up"}
            </button>
          </form>

          <p className="text-gray-400 text-sm text-center mt-6">
            Already have an account? <Link href="/" className="text-purple-400 hover:underline">Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}