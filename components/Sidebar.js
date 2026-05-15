"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FaHome, FaRobot, FaCalendarAlt, FaMoneyBillWave, FaUser, FaSignOutAlt, FaBars, FaTimes } from "react-icons/fa";

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const navItems = [
    { name: "Dashboard", icon: FaHome, path: "/dashboard" },
    { name: "AI Assistant", icon: FaRobot, path: "/ai-assistant" },
    { name: "Timetable", icon: FaCalendarAlt, path: "/timetable" },
    { name: "Money Tracker", icon: FaMoneyBillWave, path: "/money-tracker" },
    { name: "Profile", icon: FaUser, path: "/profile" },
  ];

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const handleNavigation = (path) => {
    window.location.href = path;
    if (isMobile) setIsOpen(false);
  };

  // Mobile: Hamburger button only
  if (isMobile) {
    return (
      <>
        {/* Hamburger Button */}
        <button
          onClick={toggleSidebar}
          className="fixed top-4 left-4 z-50 p-2 glass rounded-lg text-white"
        >
          <FaBars size={20} />
        </button>

        {/* Overlay */}
        {isOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setIsOpen(false)}
          />
        )}

        {/* Sidebar Menu */}
        <div
          className={`fixed top-0 left-0 h-full w-64 bg-gradient-to-b from-slate-900 to-purple-900 z-50 transform transition-transform duration-300 ${
            isOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="p-4 flex justify-between items-center border-b border-white/10">
            <h1 className="text-xl font-bold text-white">Student Companion</h1>
            <button onClick={toggleSidebar} className="text-white">
              <FaTimes size={20} />
            </button>
          </div>
          
          <nav className="p-4 space-y-2">
            {navItems.map((item) => {
              const isActive = pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => handleNavigation(item.path)}
                  className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg transition ${
                    isActive ? "bg-white/20 text-white" : "hover:bg-white/10 text-gray-300"
                  }`}
                >
                  <item.icon size={18} />
                  <span>{item.name}</span>
                </button>
              );
            })}
            <button
              onClick={() => handleNavigation("/")}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-lg hover:bg-red-500/20 text-red-400 transition"
            >
              <FaSignOutAlt size={18} />
              <span>Logout</span>
            </button>
          </nav>
        </div>
      </>
    );
  }

  // Desktop: Fixed sidebar
  return (
    <div className="fixed left-0 top-0 h-full w-64 bg-gradient-to-b from-slate-900 to-purple-900 border-r border-white/10 p-6">
      <h1 className="text-xl font-bold text-white mb-8">Student Companion</h1>
      <nav className="space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link key={item.path} href={item.path}>
              <div
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition cursor-pointer ${
                  isActive ? "bg-white/20 text-white" : "hover:bg-white/10 text-gray-300"
                }`}
              >
                <item.icon size={18} />
                <span>{item.name}</span>
              </div>
            </Link>
          );
        })}
        <Link href="/">
          <div className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-red-500/20 text-red-400 transition cursor-pointer">
            <FaSignOutAlt size={18} />
            <span>Logout</span>
          </div>
        </Link>
      </nav>
    </div>
  );
}