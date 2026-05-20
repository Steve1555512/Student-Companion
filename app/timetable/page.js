"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";

const COURSE_COLORS = [
  "bg-purple-500", "bg-blue-500", "bg-green-500", "bg-yellow-500",
  "bg-pink-500", "bg-orange-500", "bg-teal-500", "bg-red-500"
];

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

const timeOptions = [];
for (let hour = 7; hour <= 20; hour++) {
  for (let minute of ["00", "30"]) {
    const hour12 = hour > 12 ? hour - 12 : hour;
    const ampm = hour >= 12 ? "PM" : "AM";
    timeOptions.push({
      value: `${hour.toString().padStart(2, "0")}:${minute}`,
      label: `${hour12}:${minute} ${ampm}`
    });
  }
}

function formatTime(time24) {
  if (!time24) return "";
  const [hour, minute] = time24.split(":");
  const h = parseInt(hour);
  return `${h > 12 ? h - 12 : h}:${minute} ${h >= 12 ? "PM" : "AM"}`;
}

function getToday() {
  return ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][new Date().getDay()];
}

function minutesFromMidnight(time24) {
  const [h, m] = time24.split(":").map(Number);
  return h * 60 + m;
}

export default function Timetable() {
  const [activeTab, setActiveTab] = useState("today");
  const [courses, setCourses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [studySessions, setStudySessions] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [showAssignmentForm, setShowAssignmentForm] = useState(false);
  const [showStudyForm, setShowStudyForm] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [notifPermission, setNotifPermission] = useState("default");
  const [studyStreak, setStudyStreak] = useState(0);
  const [attendance, setAttendance] = useState({});
  const notifRef = useRef([]);

  const [newCourse, setNewCourse] = useState({
    name: "", day: "Monday", startTime: "09:00", endTime: "10:00", venue: "", color: "bg-purple-500", notify: true
  });
  const [newAssignment, setNewAssignment] = useState({
    title: "", course: "", dueDate: "", dueTime: "23:59", priority: "medium", notes: ""
  });
  const [newStudy, setNewStudy] = useState({
    subject: "", day: "Monday", startTime: "18:00", endTime: "20:00", goal: ""
  });

  // Load data
  useEffect(() => {
    setIsClient(true);
    const load = (key, fallback = []) => {
      try {
        const saved = localStorage.getItem(key);
        return saved ? JSON.parse(saved) : fallback;
      } catch { return fallback; }
    };
    setCourses(load("timetable_courses"));
    setAssignments(load("timetable_assignments"));
    setStudySessions(load("timetable_study"));
    setAttendance(load("timetable_attendance", {}));

    // Study streak
    const streak = parseInt(localStorage.getItem("study_streak") || "0");
    const lastStudy = localStorage.getItem("last_study_date");
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    if (lastStudy === today) setStudyStreak(streak);
    else if (lastStudy === yesterday) setStudyStreak(streak);
    else setStudyStreak(0);

    // Notification permission
    if ("Notification" in window) setNotifPermission(Notification.permission);
  }, []);

  // Live clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Notification checker — runs every minute
  useEffect(() => {
    if (!isClient) return;
    const check = setInterval(() => {
      const now = new Date();
      const todayName = getToday();
      const nowMins = now.getHours() * 60 + now.getMinutes();

      // Class notifications (15 mins before)
      courses.filter(c => c.notify && c.day === todayName).forEach(c => {
        const classMins = minutesFromMidnight(c.startTime);
        const diff = classMins - nowMins;
        const key = `class-${c.id}-${now.toDateString()}`;
        if ((diff === 15 || diff === 0) && !notifRef.current.includes(key)) {
          notifRef.current.push(key);
          sendNotification(
            diff === 15 ? `⏰ Class in 15 minutes!` : `🔔 Class starting NOW!`,
            `${c.name} at ${formatTime(c.startTime)} — ${c.venue}`
          );
        }
      });

      // Assignment notifications
      assignments.filter(a => !a.submitted).forEach(a => {
        const due = new Date(`${a.dueDate}T${a.dueTime}`);
        const diffMs = due - now;
        const diffHrs = diffMs / (1000 * 60 * 60);
        const key24 = `assign-24-${a.id}`;
        const key1 = `assign-1-${a.id}`;
        const key0 = `assign-0-${a.id}`;
        if (diffHrs <= 24 && diffHrs > 23 && !notifRef.current.includes(key24)) {
          notifRef.current.push(key24);
          sendNotification("📝 Assignment Due Tomorrow!", `"${a.title}" for ${a.course} is due tomorrow!`);
        }
        if (diffHrs <= 1 && diffHrs > 0 && !notifRef.current.includes(key1)) {
          notifRef.current.push(key1);
          sendNotification("🚨 Assignment Due in 1 Hour!", `"${a.title}" for ${a.course} is due very soon!`);
        }
        if (diffMs <= 0 && diffMs > -60000 && !notifRef.current.includes(key0)) {
          notifRef.current.push(key0);
          sendNotification("❗ Assignment OVERDUE!", `"${a.title}" for ${a.course} was due NOW!`);
        }
      });
    }, 30000);
    return () => clearInterval(check);
  }, [isClient, courses, assignments]);

  const sendNotification = (title, body) => {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(title, { body, icon: "/favicon.ico" });
    }
  };

  const requestNotifications = async () => {
    if ("Notification" in window) {
      const perm = await Notification.requestPermission();
      setNotifPermission(perm);
      if (perm === "granted") sendNotification("✅ Notifications enabled!", "You'll now get class and assignment reminders.");
    }
  };

  const save = (key, data) => localStorage.setItem(key, JSON.stringify(data));

  const addCourse = () => {
    if (!newCourse.name.trim()) return alert("Enter course name");
    const updated = [...courses, { ...newCourse, id: Date.now(), time: `${formatTime(newCourse.startTime)} - ${formatTime(newCourse.endTime)}` }];
    setCourses(updated); save("timetable_courses", updated);
    setNewCourse({ name: "", day: "Monday", startTime: "09:00", endTime: "10:00", venue: "", color: "bg-purple-500", notify: true });
    setShowForm(false);
  };

  const addAssignment = () => {
    if (!newAssignment.title.trim() || !newAssignment.dueDate) return alert("Enter title and due date");
    const updated = [...assignments, { ...newAssignment, id: Date.now(), submitted: false, createdAt: new Date().toISOString() }];
    setAssignments(updated); save("timetable_assignments", updated);
    setNewAssignment({ title: "", course: "", dueDate: "", dueTime: "23:59", priority: "medium", notes: "" });
    setShowAssignmentForm(false);
  };

  const addStudySession = () => {
    if (!newStudy.subject.trim()) return alert("Enter subject");
    const updated = [...studySessions, { ...newStudy, id: Date.now(), completed: false }];
    setStudySessions(updated); save("timetable_study", updated);
    setNewStudy({ subject: "", day: "Monday", startTime: "18:00", endTime: "20:00", goal: "" });
    setShowStudyForm(false);
  };

  const toggleAttendance = (courseId, dateStr) => {
    const key = `${courseId}-${dateStr}`;
    const updated = { ...attendance, [key]: !attendance[key] };
    setAttendance(updated); save("timetable_attendance", updated);
  };

  const markStudyDone = (id) => {
    const updated = studySessions.map(s => s.id === id ? { ...s, completed: !s.completed } : s);
    setStudySessions(updated); save("timetable_study", updated);
    const today = new Date().toDateString();
    const lastStudy = localStorage.getItem("last_study_date");
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    let newStreak = studyStreak;
    if (lastStudy !== today) {
      newStreak = lastStudy === yesterday ? studyStreak + 1 : 1;
      setStudyStreak(newStreak);
      localStorage.setItem("study_streak", newStreak.toString());
      localStorage.setItem("last_study_date", today);
    }
  };

  const toggleSubmitted = (id) => {
    const updated = assignments.map(a => a.id === id ? { ...a, submitted: !a.submitted } : a);
    setAssignments(updated); save("timetable_assignments", updated);
  };

  const deleteCourse = (id) => { if (confirm("Delete course?")) { const u = courses.filter(c => c.id !== id); setCourses(u); save("timetable_courses", u); } };
  const deleteAssignment = (id) => { if (confirm("Delete assignment?")) { const u = assignments.filter(a => a.id !== id); setAssignments(u); save("timetable_assignments", u); } };
  const deleteStudy = (id) => { if (confirm("Delete study session?")) { const u = studySessions.filter(s => s.id !== id); setStudySessions(u); save("timetable_study", u); } };

  // Today's classes
  const todayName = getToday();
  const todayClasses = courses.filter(c => c.day === todayName).sort((a, b) => minutesFromMidnight(a.startTime) - minutesFromMidnight(b.startTime));
  const nowMins = currentTime.getHours() * 60 + currentTime.getMinutes();

  // Next class
  const nextClass = todayClasses.find(c => minutesFromMidnight(c.startTime) > nowMins);
  const currentClass = todayClasses.find(c => minutesFromMidnight(c.startTime) <= nowMins && minutesFromMidnight(c.endTime) > nowMins);
  const nextClassMins = nextClass ? minutesFromMidnight(nextClass.startTime) - nowMins : null;

  // Assignment stats
  const pendingAssignments = assignments.filter(a => !a.submitted);
  const overdueAssignments = pendingAssignments.filter(a => new Date(`${a.dueDate}T${a.dueTime}`) < currentTime);
  const dueSoonAssignments = pendingAssignments.filter(a => {
    const diff = new Date(`${a.dueDate}T${a.dueTime}`) - currentTime;
    return diff > 0 && diff < 86400000;
  });

  const priorityColor = { high: "border-red-500 bg-red-500/10", medium: "border-yellow-500 bg-yellow-500/10", low: "border-green-500 bg-green-500/10" };
  const priorityBadge = { high: "bg-red-500 text-white", medium: "bg-yellow-500 text-black", low: "bg-green-500 text-white" };

  if (!isClient) return <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-slate-900 p-4 text-white">Loading...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-slate-900 p-4">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold text-white">📅 My Timetable</h1>
            <p className="text-gray-400 text-sm">{currentTime.toLocaleTimeString()} • {todayName}</p>
          </div>
          <Link href="/dashboard"><button className="text-gray-300 text-sm">← Dashboard</button></Link>
        </div>

        {/* Notification Banner */}
        {notifPermission !== "granted" && (
          <div className="mb-4 p-3 bg-blue-500/20 border border-blue-500 rounded-xl flex justify-between items-center">
            <p className="text-blue-300 text-sm">🔔 Enable notifications to get class & assignment reminders!</p>
            <button onClick={requestNotifications} className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-semibold">Enable</button>
          </div>
        )}

        {/* Alert Banners */}
        {overdueAssignments.length > 0 && (
          <div className="mb-3 p-3 bg-red-500/20 border border-red-500 rounded-xl animate-pulse">
            <p className="text-red-300 font-bold">🚨 {overdueAssignments.length} assignment(s) OVERDUE! Check assignments tab.</p>
          </div>
        )}
        {dueSoonAssignments.length > 0 && (
          <div className="mb-3 p-3 bg-yellow-500/20 border border-yellow-500 rounded-xl">
            <p className="text-yellow-300 font-bold">⚠️ {dueSoonAssignments.length} assignment(s) due within 24 hours!</p>
          </div>
        )}

        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-3 mb-4">
          <div className="bg-white/10 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-white">{courses.length}</p>
            <p className="text-gray-400 text-xs">Courses</p>
          </div>
          <div className="bg-white/10 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-yellow-400">{pendingAssignments.length}</p>
            <p className="text-gray-400 text-xs">Pending</p>
          </div>
          <div className="bg-white/10 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-orange-400">🔥{studyStreak}</p>
            <p className="text-gray-400 text-xs">Day Streak</p>
          </div>
          <div className="bg-white/10 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-green-400">{todayClasses.length}</p>
            <p className="text-gray-400 text-xs">Today</p>
          </div>
        </div>

        {/* Current/Next Class Card */}
        {(currentClass || nextClass) && (
          <div className={`mb-4 p-4 rounded-xl border ${currentClass ? 'bg-green-500/20 border-green-500' : 'bg-purple-500/20 border-purple-500'}`}>
            {currentClass ? (
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-green-300 text-xs font-bold uppercase tracking-wide">🟢 Happening Now</p>
                  <p className="text-white font-bold text-lg">{currentClass.name}</p>
                  <p className="text-gray-300 text-sm">{currentClass.venue} • Ends {formatTime(currentClass.endTime)}</p>
                </div>
                <button onClick={() => toggleAttendance(currentClass.id, new Date().toDateString())}
                  className={`px-4 py-2 rounded-lg text-sm font-bold ${attendance[`${currentClass.id}-${new Date().toDateString()}`] ? 'bg-green-500 text-white' : 'bg-white/20 text-white'}`}>
                  {attendance[`${currentClass.id}-${new Date().toDateString()}`] ? '✅ Present' : 'Mark Present'}
                </button>
              </div>
            ) : (
              <div>
                <p className="text-purple-300 text-xs font-bold uppercase tracking-wide">⏰ Next Class</p>
                <p className="text-white font-bold text-lg">{nextClass.name}</p>
                <p className="text-gray-300 text-sm">{nextClass.venue} • In {nextClassMins} minute{nextClassMins !== 1 ? 's' : ''} ({formatTime(nextClass.startTime)})</p>
              </div>
            )}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-4 overflow-x-auto">
          {[
            { key: "today", label: "📆 Today" },
            { key: "weekly", label: "📅 Weekly" },
            { key: "assignments", label: `📝 Tasks ${pendingAssignments.length > 0 ? `(${pendingAssignments.length})` : ''}` },
            { key: "study", label: "📚 Study" },
          ].map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold whitespace-nowrap transition ${activeTab === tab.key ? 'bg-purple-500 text-white' : 'bg-white/10 text-gray-300'}`}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* TODAY TAB */}
        {activeTab === "today" && (
          <div>
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-white font-bold">Today — {todayName}</h2>
              <button onClick={() => setShowForm(true)} className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm">+ Add Class</button>
            </div>
            {todayClasses.length === 0 ? (
              <div className="bg-white/5 rounded-xl p-8 text-center">
                <p className="text-4xl mb-2">🎉</p>
                <p className="text-white font-bold">No classes today!</p>
                <p className="text-gray-400 text-sm">Enjoy your free day or add a study session.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {todayClasses.map(course => {
                  const started = minutesFromMidnight(course.startTime) <= nowMins;
                  const ended = minutesFromMidnight(course.endTime) <= nowMins;
                  const isNow = started && !ended;
                  return (
                    <div key={course.id} className={`rounded-xl p-4 border-l-4 ${course.color || 'bg-purple-500'} bg-white/10 ${isNow ? 'ring-2 ring-green-400' : ''}`}>
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            {isNow && <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full animate-pulse">LIVE</span>}
                            {ended && <span className="text-xs bg-gray-500 text-white px-2 py-0.5 rounded-full">Done</span>}
                            <p className="text-white font-bold">{course.name}</p>
                          </div>
                          <p className="text-gray-300 text-sm">{formatTime(course.startTime)} - {formatTime(course.endTime)}</p>
                          <p className="text-gray-400 text-xs">📍 {course.venue}</p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <button onClick={() => toggleAttendance(course.id, new Date().toDateString())}
                            className={`text-xs px-3 py-1 rounded-lg ${attendance[`${course.id}-${new Date().toDateString()}`] ? 'bg-green-500 text-white' : 'bg-white/20 text-gray-300'}`}>
                            {attendance[`${course.id}-${new Date().toDateString()}`] ? '✅ Present' : '☐ Absent'}
                          </button>
                          <button onClick={() => deleteCourse(course.id)} className="text-red-400 text-xs">🗑 Delete</button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* WEEKLY TAB */}
        {activeTab === "weekly" && (
          <div>
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-white font-bold">Weekly Schedule</h2>
              <button onClick={() => setShowForm(true)} className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm">+ Add Class</button>
            </div>
            {days.map(day => {
              const dayCourses = courses.filter(c => c.day === day).sort((a, b) => minutesFromMidnight(a.startTime) - minutesFromMidnight(b.startTime));
              return (
                <div key={day} className="mb-4">
                  <div className={`flex items-center gap-2 mb-2 ${day === todayName ? 'text-purple-300' : 'text-gray-400'}`}>
                    <h3 className="font-bold">{day === todayName ? `📍 ${day} (Today)` : day}</h3>
                    <span className="text-xs">({dayCourses.length} class{dayCourses.length !== 1 ? 'es' : ''})</span>
                  </div>
                  {dayCourses.length === 0 ? (
                    <p className="text-gray-600 text-sm ml-2">No classes</p>
                  ) : (
                    dayCourses.map(course => (
                      <div key={course.id} className={`bg-white/10 rounded-lg p-3 mb-2 border-l-4 ${course.color || 'border-purple-500'} flex justify-between items-center`}>
                        <div>
                          <p className="text-white font-semibold">{course.name}</p>
                          <p className="text-gray-300 text-sm">{formatTime(course.startTime)} - {formatTime(course.endTime)} • 📍{course.venue}</p>
                        </div>
                        <button onClick={() => deleteCourse(course.id)} className="text-red-400 text-xs px-2 py-1 bg-red-500/20 rounded">🗑</button>
                      </div>
                    ))
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ASSIGNMENTS TAB */}
        {activeTab === "assignments" && (
          <div>
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-white font-bold">📝 Assignments & Tasks</h2>
              <button onClick={() => setShowAssignmentForm(true)} className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm">+ Add Task</button>
            </div>

            {showAssignmentForm && (
              <div className="bg-white/10 rounded-xl p-4 mb-4 border border-white/20">
                <h3 className="text-white font-bold mb-3">New Assignment</h3>
                <input type="text" placeholder="Assignment title" value={newAssignment.title}
                  onChange={e => setNewAssignment({ ...newAssignment, title: e.target.value })}
                  className="w-full p-3 bg-white/20 border border-white/30 rounded-lg mb-3 text-white placeholder-gray-300"
                  style={{ backgroundColor: 'rgba(255,255,255,0.1)' }} />
                <input type="text" placeholder="Course name" value={newAssignment.course}
                  onChange={e => setNewAssignment({ ...newAssignment, course: e.target.value })}
                  className="w-full p-3 bg-white/20 border border-white/30 rounded-lg mb-3 text-white placeholder-gray-300"
                  style={{ backgroundColor: 'rgba(255,255,255,0.1)' }} />
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="text-gray-300 text-xs mb-1 block">Due Date</label>
                    <input type="date" value={newAssignment.dueDate}
                      onChange={e => setNewAssignment({ ...newAssignment, dueDate: e.target.value })}
                      className="w-full p-3 bg-white/20 border border-white/30 rounded-lg text-white"
                      style={{ backgroundColor: 'rgba(255,255,255,0.1)', colorScheme: 'dark' }} />
                  </div>
                  <div>
                    <label className="text-gray-300 text-xs mb-1 block">Due Time</label>
                    <select value={newAssignment.dueTime}
                      onChange={e => setNewAssignment({ ...newAssignment, dueTime: e.target.value })}
                      className="w-full p-3 bg-white/20 border border-white/30 rounded-lg text-white"
                      style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
                      {timeOptions.map(t => <option key={t.value} value={t.value} style={{ backgroundColor: '#1e1b4b' }}>{t.label}</option>)}
                    </select>
                  </div>
                </div>
                <select value={newAssignment.priority}
                  onChange={e => setNewAssignment({ ...newAssignment, priority: e.target.value })}
                  className="w-full p-3 bg-white/20 border border-white/30 rounded-lg mb-3 text-white"
                  style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
                  <option value="high" style={{ backgroundColor: '#1e1b4b' }}>🔴 High Priority</option>
                  <option value="medium" style={{ backgroundColor: '#1e1b4b' }}>🟡 Medium Priority</option>
                  <option value="low" style={{ backgroundColor: '#1e1b4b' }}>🟢 Low Priority</option>
                </select>
                <textarea placeholder="Notes (optional)" value={newAssignment.notes}
                  onChange={e => setNewAssignment({ ...newAssignment, notes: e.target.value })}
                  className="w-full p-3 bg-white/20 border border-white/30 rounded-lg mb-3 text-white placeholder-gray-300 h-20"
                  style={{ backgroundColor: 'rgba(255,255,255,0.1)' }} />
                <div className="flex gap-3">
                  <button onClick={addAssignment} className="flex-1 py-3 bg-blue-500 text-white rounded-lg font-semibold">Save</button>
                  <button onClick={() => setShowAssignmentForm(false)} className="flex-1 py-3 bg-red-500/20 text-red-400 rounded-lg">Cancel</button>
                </div>
              </div>
            )}

            {assignments.length === 0 ? (
              <div className="bg-white/5 rounded-xl p-8 text-center">
                <p className="text-4xl mb-2">✅</p>
                <p className="text-white font-bold">No assignments yet!</p>
                <p className="text-gray-400 text-sm">Add your first task above.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {[...assignments].sort((a, b) => new Date(`${a.dueDate}T${a.dueTime}`) - new Date(`${b.dueDate}T${b.dueTime}`)).map(a => {
                  const due = new Date(`${a.dueDate}T${a.dueTime}`);
                  const isOverdue = due < currentTime && !a.submitted;
                  const isDueSoon = due - currentTime < 86400000 && due > currentTime && !a.submitted;
                  const diffMs = due - currentTime;
                  const diffHrs = Math.abs(Math.floor(diffMs / 3600000));
                  const diffDays = Math.abs(Math.floor(diffMs / 86400000));
                  const timeLeft = a.submitted ? "Submitted ✅" : isOverdue ? `Overdue by ${diffHrs}h` : diffDays > 0 ? `${diffDays}d ${diffHrs % 24}h left` : `${diffHrs}h left`;

                  return (
                    <div key={a.id} className={`rounded-xl p-4 border-l-4 ${a.submitted ? 'opacity-50 bg-white/5 border-gray-500' : priorityColor[a.priority]}`}>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${priorityBadge[a.priority]}`}>{a.priority.toUpperCase()}</span>
                            {isOverdue && <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full animate-pulse">OVERDUE</span>}
                            {isDueSoon && <span className="text-xs bg-yellow-500 text-black px-2 py-0.5 rounded-full">DUE SOON</span>}
                            <p className={`font-bold text-white ${a.submitted ? 'line-through' : ''}`}>{a.title}</p>
                          </div>
                          <p className="text-gray-400 text-xs">{a.course} • Due: {a.dueDate} {formatTime(a.dueTime)}</p>
                          <p className={`text-xs mt-1 font-semibold ${isOverdue ? 'text-red-400' : isDueSoon ? 'text-yellow-400' : 'text-green-400'}`}>⏱ {timeLeft}</p>
                          {a.notes && <p className="text-gray-400 text-xs mt-1">📌 {a.notes}</p>}
                        </div>
                        <div className="flex flex-col gap-2 ml-3">
                          <button onClick={() => toggleSubmitted(a.id)}
                            className={`text-xs px-3 py-1 rounded-lg ${a.submitted ? 'bg-gray-500 text-white' : 'bg-green-500 text-white'}`}>
                            {a.submitted ? 'Undo' : '✅ Done'}
                          </button>
                          <button onClick={() => deleteAssignment(a.id)} className="text-red-400 text-xs px-3 py-1 bg-red-500/20 rounded-lg">🗑</button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* STUDY TAB */}
        {activeTab === "study" && (
          <div>
            <div className="flex justify-between items-center mb-3">
              <div>
                <h2 className="text-white font-bold">📚 Study Timetable</h2>
                <p className="text-orange-400 text-sm">🔥 {studyStreak} day streak!</p>
              </div>
              <button onClick={() => setShowStudyForm(true)} className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm">+ Add Session</button>
            </div>

            {showStudyForm && (
              <div className="bg-white/10 rounded-xl p-4 mb-4 border border-white/20">
                <h3 className="text-white font-bold mb-3">New Study Session</h3>
                <input type="text" placeholder="Subject to study" value={newStudy.subject}
                  onChange={e => setNewStudy({ ...newStudy, subject: e.target.value })}
                  className="w-full p-3 bg-white/20 border border-white/30 rounded-lg mb-3 text-white placeholder-gray-300"
                  style={{ backgroundColor: 'rgba(255,255,255,0.1)' }} />
                <select value={newStudy.day} onChange={e => setNewStudy({ ...newStudy, day: e.target.value })}
                  className="w-full p-3 bg-white/20 border border-white/30 rounded-lg mb-3 text-white"
                  style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
                  {days.map(d => <option key={d} value={d} style={{ backgroundColor: '#1e1b4b' }}>{d}</option>)}
                </select>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="text-gray-300 text-xs mb-1 block">Start Time</label>
                    <select value={newStudy.startTime} onChange={e => setNewStudy({ ...newStudy, startTime: e.target.value })}
                      className="w-full p-3 bg-white/20 border border-white/30 rounded-lg text-white"
                      style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
                      {timeOptions.map(t => <option key={t.value} value={t.value} style={{ backgroundColor: '#1e1b4b' }}>{t.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-gray-300 text-xs mb-1 block">End Time</label>
                    <select value={newStudy.endTime} onChange={e => setNewStudy({ ...newStudy, endTime: e.target.value })}
                      className="w-full p-3 bg-white/20 border border-white/30 rounded-lg text-white"
                      style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
                      {timeOptions.map(t => <option key={t.value} value={t.value} style={{ backgroundColor: '#1e1b4b' }}>{t.label}</option>)}
                    </select>
                  </div>
                </div>
                <input type="text" placeholder="Study goal (e.g., Complete chapter 3)" value={newStudy.goal}
                  onChange={e => setNewStudy({ ...newStudy, goal: e.target.value })}
                  className="w-full p-3 bg-white/20 border border-white/30 rounded-lg mb-3 text-white placeholder-gray-300"
                  style={{ backgroundColor: 'rgba(255,255,255,0.1)' }} />
                <div className="flex gap-3">
                  <button onClick={addStudySession} className="flex-1 py-3 bg-orange-500 text-white rounded-lg font-semibold">Save</button>
                  <button onClick={() => setShowStudyForm(false)} className="flex-1 py-3 bg-red-500/20 text-red-400 rounded-lg">Cancel</button>
                </div>
              </div>
            )}

            {studySessions.length === 0 ? (
              <div className="bg-white/5 rounded-xl p-8 text-center">
                <p className="text-4xl mb-2">📚</p>
                <p className="text-white font-bold">No study sessions yet!</p>
                <p className="text-gray-400 text-sm">Plan your study time and build a streak!</p>
              </div>
            ) : (
              <div>
                {days.map(day => {
                  const daySessions = studySessions.filter(s => s.day === day);
                  if (daySessions.length === 0) return null;
                  return (
                    <div key={day} className="mb-4">
                      <h3 className={`font-bold mb-2 ${day === todayName ? 'text-orange-300' : 'text-gray-400'}`}>
                        {day === todayName ? `📍 ${day} (Today)` : day}
                      </h3>
                      {daySessions.map(s => (
                        <div key={s.id} className={`rounded-xl p-4 mb-2 border ${s.completed ? 'opacity-60 border-gray-600 bg-white/5' : 'border-orange-500/30 bg-orange-500/10'}`}>
                          <div className="flex justify-between items-start">
                            <div>
                              <p className={`text-white font-bold ${s.completed ? 'line-through' : ''}`}>{s.subject}</p>
                              <p className="text-gray-400 text-sm">{formatTime(s.startTime)} - {formatTime(s.endTime)}</p>
                              {s.goal && <p className="text-orange-300 text-xs mt-1">🎯 {s.goal}</p>}
                            </div>
                            <div className="flex gap-2">
                              <button onClick={() => markStudyDone(s.id)}
                                className={`text-xs px-3 py-1 rounded-lg ${s.completed ? 'bg-gray-500 text-white' : 'bg-orange-500 text-white'}`}>
                                {s.completed ? 'Undo' : '✅ Done'}
                              </button>
                              <button onClick={() => deleteStudy(s.id)} className="text-red-400 text-xs px-2 py-1 bg-red-500/20 rounded-lg">🗑</button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Add Course Form (shared) */}
        {showForm && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-indigo-900 rounded-xl p-6 w-full max-w-md border border-white/20">
              <h3 className="text-white font-bold mb-4 text-lg">Add New Class</h3>
              <input type="text" placeholder="Course Name (e.g., CSC 401 - AI)" value={newCourse.name}
                onChange={e => setNewCourse({ ...newCourse, name: e.target.value })}
                className="w-full p-3 bg-white/20 border border-white/30 rounded-lg mb-3 text-white placeholder-gray-300"
                style={{ backgroundColor: 'rgba(255,255,255,0.1)' }} />
              <select value={newCourse.day} onChange={e => setNewCourse({ ...newCourse, day: e.target.value })}
                className="w-full p-3 bg-white/20 border border-white/30 rounded-lg mb-3 text-white"
                style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
                {days.map(d => <option key={d} value={d} style={{ backgroundColor: '#1e1b4b' }}>{d}</option>)}
              </select>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="text-gray-300 text-xs mb-1 block">Start Time</label>
                  <select value={newCourse.startTime} onChange={e => setNewCourse({ ...newCourse, startTime: e.target.value })}
                    className="w-full p-3 bg-white/20 border border-white/30 rounded-lg text-white"
                    style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
                    {timeOptions.map(t => <option key={t.value} value={t.value} style={{ backgroundColor: '#1e1b4b' }}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-gray-300 text-xs mb-1 block">End Time</label>
                  <select value={newCourse.endTime} onChange={e => setNewCourse({ ...newCourse, endTime: e.target.value })}
                    className="w-full p-3 bg-white/20 border border-white/30 rounded-lg text-white"
                    style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
                    {timeOptions.map(t => <option key={t.value} value={t.value} style={{ backgroundColor: '#1e1b4b' }}>{t.label}</option>)}
                  </select>
                </div>
              </div>
              <input type="text" placeholder="Venue (e.g., LT 101, Online)" value={newCourse.venue}
                onChange={e => setNewCourse({ ...newCourse, venue: e.target.value })}
                className="w-full p-3 bg-white/20 border border-white/30 rounded-lg mb-3 text-white placeholder-gray-300"
                style={{ backgroundColor: 'rgba(255,255,255,0.1)' }} />
              <div className="mb-3">
                <label className="text-gray-300 text-xs mb-2 block">Course Color</label>
                <div className="flex gap-2 flex-wrap">
                  {COURSE_COLORS.map(color => (
                    <button key={color} onClick={() => setNewCourse({ ...newCourse, color })}
                      className={`w-8 h-8 rounded-full ${color} ${newCourse.color === color ? 'ring-2 ring-white scale-110' : ''} transition`} />
                  ))}
                </div>
              </div>
              <label className="flex items-center gap-2 text-gray-300 text-sm mb-4 cursor-pointer">
                <input type="checkbox" checked={newCourse.notify} onChange={e => setNewCourse({ ...newCourse, notify: e.target.checked })} className="w-4 h-4" />
                🔔 Notify me 15 mins before class
              </label>
              <div className="flex gap-3">
                <button onClick={addCourse} className="flex-1 py-3 bg-blue-500 text-white rounded-lg font-semibold">Save Class</button>
                <button onClick={() => setShowForm(false)} className="flex-1 py-3 bg-red-500/20 text-red-400 rounded-lg">Cancel</button>
              </div>
            </div>
          </div>
        )}

        <div className="mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-center">
          <p className="text-green-300 text-sm"> All data saved locally • 🔔 Notifications active</p>
        </div>
      </div>
    </div>
  );
}