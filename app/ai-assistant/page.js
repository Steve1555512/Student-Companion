"use client";
import { useState, useRef, useEffect } from "react";
import ReactMarkdown from 'react-markdown';
import { FaPaperclip, FaSpinner, FaFileAlt, FaTimes, FaRobot, FaUser, FaTrash } from "react-icons/fa";

const SYSTEM_INSTRUCTION = `You are a smart, friendly academic assistant for university students named "EduBot".

You CAN:
- Respond warmly to greetings (e.g. "Hello!", "Hi there! How can I help you learn today?")
- Answer ANY educational question across ALL academic subjects including:
  mathematics, science, physics, chemistry, biology, history, geography, literature, 
  programming, computer science, economics, law, medicine, engineering, languages, 
  philosophy, psychology, sociology, art, music, political science, civics,
  current affairs, general knowledge, and more
- Answer factual questions about real people, countries, governments, leaders, 
  capitals, populations, and world events
- Explain concepts clearly with examples, analogies, and step-by-step breakdowns
- Help with homework, exam prep, essays, and research
- Analyze uploaded notes and generate study questions
- Answer follow-up questions and have academic discussions

You CANNOT:
- Answer non-educational requests like jokes, recipes, celebrity gossip, 
  entertainment reviews, personal advice unrelated to academics, or casual small talk beyond greetings
- Give personal opinions on controversial political topics or tell someone who to vote for
- If asked something non-educational, respond with: 
  "That's outside my academic scope! I'm here to help you learn. Ask me any educational question and I'll do my best to explain it clearly. 😊"

Personality:
- Be friendly, encouraging, and enthusiastic about learning
- Give detailed, well-structured answers with examples where helpful
- Use bullet points, numbered lists, or headers to organize complex answers
- Celebrate curiosity and make learning enjoyable
- Keep responses concise and fast — avoid unnecessarily long answers`;

async function askGemini(question) {
  const keyRes = await fetch('/api/chat');
  const { apiKey } = await keyRes.json();

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
        contents: [{ role: 'user', parts: [{ text: question }] }],
        generationConfig: {
          maxOutputTokens: 800,
          temperature: 0.7,
        }
      })
    }
  );

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (text) return text;
  if (data.promptFeedback?.blockReason) return "I can only answer educational questions. Please ask me something academic.";
  return "Sorry, I couldn't generate a response. Please rephrase your question.";
}
  

export default function AIAssistant() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [file, setFile] = useState(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { role: "user", content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const answer = await askGemini(input);
      setMessages(prev => [...prev, { role: "ai", content: answer }]);
    } catch (error) {
      console.error("Error:", error);
      setMessages(prev => [...prev, { role: "ai", content: `Error: ${error.message}` }]);
    } finally {
      setIsLoading(false);
    }
  };

 const handleFileUpload = async (e) => {
  const uploadedFile = e.target.files[0];
  if (!uploadedFile) return;

  setFile(uploadedFile);
  setIsSummarizing(true);

  try {
    const formData = new FormData();
    formData.append('file', uploadedFile);

    const res = await fetch('/api/chat', {
      method: 'POST',
      body: formData
    });

    const data = await res.json();
    if (data.error) throw new Error(data.error);

    setMessages(prev => [...prev, {
      role: "ai",
      content: `✅ I've analyzed "${uploadedFile.name}". Here is my analysis:\n\n${data.text}`
    }]);

  } catch (error) {
    setMessages(prev => [...prev, {
      role: "ai",
      content: `Sorry, I couldn't analyze the file: ${error.message}`
    }]);
  } finally {
    setIsSummarizing(false);
  }
};
  const clearFile = () => {
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const clearChat = () => {
    setMessages([
      { role: "ai", content: "Chat cleared. I am your AI Academic Assistant. Ask me any academic question!" }
    ]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-slate-900">
      {/* Sidebar */}
      <div className="fixed left-0 top-0 h-full w-64 bg-white/5 backdrop-blur-xl border-r border-white/10 p-6">
        <h1 className="text-xl font-bold text-white mb-8">Student Companion</h1>
        <nav className="space-y-2">
          <div onClick={() => window.location.href = "/dashboard"} className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/10 transition cursor-pointer">
            <span>🏠</span>
            <span className="text-gray-300">Dashboard</span>
          </div>
          <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-white/10 cursor-pointer">
            <span>🤖</span>
            <span className="text-white font-semibold">AI Assistant</span>
          </div>
        </nav>
        <button onClick={() => window.location.href = "/"} className="absolute bottom-6 left-6 right-6 py-3 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition">
          🚪 Logout
        </button>
      </div>

      {/* Main Content */}
      <div className="ml-64 p-8">
        <h1 className="text-3xl font-bold text-white mb-4">AI Academic Assistant</h1>

        {/* File Upload Section */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 mb-6">
          <h2 className="text-xl font-bold text-white mb-4">Upload Notes</h2>
          <div className="border-2 border-dashed border-white/20 rounded-lg p-6 text-center hover:border-blue-500 transition cursor-pointer"
               onClick={() => fileInputRef.current?.click()}>
            <input ref={fileInputRef} type="file" className="hidden" accept=".pdf,.docx,.txt" onChange={handleFileUpload} />
            <FaPaperclip className="text-3xl text-gray-400 mx-auto mb-2" />
            <p className="text-gray-300">Click to upload your notes</p>
            <p className="text-gray-500 text-sm">AI will analyze and generate summaries & questions</p>
          </div>

          {file && (
            <div className="mt-4 p-3 bg-blue-500/20 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FaFileAlt className="text-blue-400" />
                <span className="text-white text-sm">{file.name}</span>
              </div>
              <button onClick={clearFile} className="text-red-400 hover:text-red-300">
                <FaTimes />
              </button>
            </div>
          )}

          {isSummarizing && (
            <div className="mt-4 p-3 bg-purple-500/20 rounded-lg text-center">
              <FaSpinner className="animate-spin inline mr-2" />
              <span className="text-purple-300">AI analyzing your notes...</span>
            </div>
          )}
        </div>

        {/* Chat Section */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-white">Ask an Academic Question</h2>
            <button onClick={clearChat} className="text-gray-400 hover:text-red-400 text-sm flex items-center gap-1">
              <FaTrash size={12} /> Clear
            </button>
          </div>

          {/* Chat Messages */}
          <div className="h-96 overflow-y-auto mb-4 space-y-3">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] p-4 rounded-2xl ${msg.role === "user" ? "bg-purple-500/30" : "bg-blue-500/30"}`}>
                  <div className="flex items-center gap-2 mb-2">
                    {msg.role === "user" ? <FaUser size={14} /> : <FaRobot size={14} />}
                    <span className="text-xs text-gray-300">{msg.role === "user" ? "You" : "AI (Gemini)"}</span>
                  </div>
                  <div className="text-white text-sm leading-relaxed prose prose-invert max-w-none">
  <ReactMarkdown>{msg.content}</ReactMarkdown>
</div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-blue-500/30 p-4 rounded-2xl flex items-center gap-2">
                  <FaSpinner className="animate-spin text-white" />
                  <span className="text-white text-sm">Thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSend()}
              placeholder="Ask an academic question..."
              className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 text-base"
            />
            <button onClick={handleSend} className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:shadow-lg transition">
              Send
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 p-2 text-center">
  <p className="text-gray-600 text-xs">Academic AI Assistant • Powered by Google</p>
</div>
      </div>
    </div>
  );
}