"use client";
import { useState, useRef, useEffect } from "react";
import { FaPaperPlane, FaRobot, FaUser } from "react-icons/fa";

export default function AIChat() {
  const [messages, setMessages] = useState([
    { role: "ai", content: "Hello! I'm your AI Academic Assistant. I can help with note summarization, exam preparation, and academic questions. What would you like to know?" }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const academicKeywords = ["explain", "define", "what is", "calculate", "formula", "theory", "concept", "algorithm", "equation", "solve", "analyze", "compare", "discuss", "summarize"];

  const isAcademicQuery = (query) => {
    return academicKeywords.some(keyword => query.toLowerCase().includes(keyword));
  };

  const getAIResponse = async (userMessage) => {
    if (!isAcademicQuery(userMessage)) {
      return "I'm sorry, I can only answer academic questions related to your studies. Please ask me about course content, assignments, or exam preparation.";
    }

    // Simulate academic response
    const responses = {
      default: "Based on academic resources, here's what you need to know: This topic involves understanding core principles and applying them to practical scenarios. Would you like me to explain further or provide examples?",
      algorithm: "An algorithm is a step-by-step procedure for solving a problem. Key characteristics include: 1) Input, 2) Output, 3) Definiteness, 4) Finiteness, 5) Effectiveness. Common examples include sorting algorithms like QuickSort and searching algorithms like Binary Search.",
      neural: "Neural networks are computing systems inspired by biological brains. They consist of layers of interconnected nodes (neurons) that process information. Deep learning uses multiple hidden layers to learn hierarchical representations of data.",
    };

    for (const [key, response] of Object.entries(responses)) {
      if (userMessage.toLowerCase().includes(key)) {
        return response;
      }
    }
    
    return responses.default;
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { role: "user", content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    setTimeout(async () => {
      const aiResponse = await getAIResponse(input);
      setMessages(prev => [...prev, { role: "ai", content: aiResponse }]);
      setIsTyping(false);
    }, 1000);
  };

  return (
    <div className="flex flex-col h-[500px]">
      <div className="flex-1 overflow-y-auto space-y-3 mb-4">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div className={`flex items-start gap-2 max-w-[80%] ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${msg.role === "user" ? "bg-purple-500" : "bg-blue-500"}`}>
                {msg.role === "user" ? <FaUser size={14} /> : <FaRobot size={14} />}
              </div>
              <div className={`p-3 rounded-lg ${msg.role === "user" ? "bg-gradient-to-r from-purple-500 to-pink-500" : "glass"}`}>
                <p className="text-white text-sm">{msg.content}</p>
              </div>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="glass p-3 rounded-lg">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></span>
                <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-100"></span>
                <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-200"></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && handleSend()}
          placeholder="Ask me an academic question..."
          className="flex-1 px-4 py-2 glass rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
        />
        <button
          onClick={handleSend}
          className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition"
        >
          <FaPaperPlane />
        </button>
      </div>
    </div>
  );
}