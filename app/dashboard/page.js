"use client";
import { useEffect, useState } from "react";
import Sidebar from "../../components/Sidebar";

export default function Dashboard() {
  const [greeting, setGreeting] = useState("");

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good Morning");
    else if (hour < 17) setGreeting("Good Afternoon");
    else setGreeting("Good Evening");
  }, []);

  const goToPage = (page) => {
    window.location.href = page;
  };

  const handleLogout = () => {
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Sidebar */}
      <div className="fixed left-0 top-0 h-full w-64 bg-white/5 backdrop-blur-xl border-r border-white/10 p-6">
        <h1 className="text-xl font-bold text-white mb-8">Student Companion</h1>
        <nav className="space-y-2">
          <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-white/10 cursor-pointer">
            <span>🏠</span>
            <span className="text-white font-semibold">Dashboard</span>
          </div>
          <div onClick={() => goToPage("/ai-assistant")} className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/10 transition cursor-pointer">
            <span>🤖</span>
            <span className="text-gray-300">AI Assistant</span>
          </div>
          <div onClick={() => goToPage("/timetable")} className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/10 transition cursor-pointer">
            <span>📅</span>
            <span className="text-gray-300">Timetable</span>
          </div>
          <div onClick={() => goToPage("/money-tracker")} className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/10 transition cursor-pointer">
            <span>💰</span>
            <span className="text-gray-300">Money Tracker</span>
          </div>
        </nav>
        <button onClick={handleLogout} className="absolute bottom-6 left-6 right-6 py-3 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition">
          🚪 Logout
        </button>
      </div>

      {/* Main Content */}
      <div className="ml-64 p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">{greeting}, Student! 👋</h1>
          <p className="text-gray-300">Welcome to your Academic Dashboard</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 text-center hover:scale-105 transition">
            <span className="text-3xl">📚</span>
            <h3 className="text-2xl font-bold text-white mt-2">5</h3>
            <p className="text-gray-300">Active Courses</p>
          </div>
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 text-center hover:scale-105 transition">
            <span className="text-3xl">📝</span>
            <h3 className="text-2xl font-bold text-white mt-2">3</h3>
            <p className="text-gray-300">Assignments Due</p>
          </div>
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 text-center hover:scale-105 transition">
            <span className="text-3xl">⏰</span>
            <h3 className="text-2xl font-bold text-white mt-2">24</h3>
            <p className="text-gray-300">Study Hours</p>
          </div>
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 text-center hover:scale-105 transition">
            <span className="text-3xl">💰</span>
            <h3 className="text-2xl font-bold text-white mt-2">₦12,500</h3>
            <p className="text-gray-300">Money Saved</p>
          </div>
        </div>

        {/* Quick Actions - 3 Big Cards */}
        <h2 className="text-2xl font-bold text-white mb-4">Quick Actions</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div onClick={() => goToPage("/ai-assistant")} className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl p-6 text-white text-center hover:scale-105 transition cursor-pointer">
            <span className="text-5xl">🤖</span>
            <h3 className="text-xl font-bold mt-3">AI Assistant</h3>
            <p className="text-sm mt-2 opacity-90">Summarize notes & ask academic questions</p>
          </div>
          <div onClick={() => goToPage("/timetable")} className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl p-6 text-white text-center hover:scale-105 transition cursor-pointer">
            <span className="text-5xl">📅</span>
            <h3 className="text-xl font-bold mt-3">Timetable</h3>
            <p className="text-sm mt-2 opacity-90">Manage your course schedule</p>
          </div>
          <div onClick={() => goToPage("/money-tracker")} className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl p-6 text-white text-center hover:scale-105 transition cursor-pointer">
            <span className="text-5xl">💰</span>
            <h3 className="text-xl font-bold mt-3">Money Tracker</h3>
            <p className="text-sm mt-2 opacity-90">Track expenses & income wisely</p>
          </div>
        </div>

        {/* Motivation Quote */}
        <div className="mt-8 p-6 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl text-center">
          <p className="text-gray-300 italic text-lg">"Success is the sum of small efforts, repeated day in and day out."</p>
          <p className="text-purple-400 mt-2">— Robert Collier</p>
        </div>
      </div>
    </div>
  );
}