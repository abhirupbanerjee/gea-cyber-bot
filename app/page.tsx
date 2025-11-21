"use client";

// Import necessary libraries and modules
import React, { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import { motion } from "framer-motion";
import remarkGfm from "remark-gfm";

// Define Message type
interface Message {
  role: string;
  content: string;
  timestamp?: string;
}

// Main ChatApp component
const ChatApp = () => {
  // Define States
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [threadId, setThreadId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeRun, setActiveRun] = useState(false);
  const [typing, setTyping] = useState(false);
  const [availableRepos, setAvailableRepos] = useState<Array<{githubUrl: string; displayName: string}>>([]);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Fetch available repositories from config
  useEffect(() => {
    fetch('/api/sonar/list-repos')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.repos) {
          setAvailableRepos(data.repos.filter((r: any) => r.configured));
        }
      })
      .catch(err => console.error('Failed to load repos:', err));
  }, []);

  // Generate welcome message with available repos
  const generateWelcomeMessage = (): string => {
    let message = `# Welcome to GEA Cyber Bot! 🤖

I'm your AI-powered code quality assistant integrated with SonarCloud. I can help you:

- 🔍 **Analyze code quality** for your GitHub repositories
- 🐛 **Identify bugs and vulnerabilities**
- 📊 **Review security hotspots**
- 💡 **Get actionable recommendations**

## Quick Actions

- [📖 What can the Cyber Bot do?](#what-capabilities)
- [➕ How do I add a new repository?](#add-repository)
`;

    if (availableRepos.length > 0) {
      message += `\n## Select from the available repositories\n\n`;
      availableRepos.forEach((repo, index) => {
        message += `${index + 1}. [${repo.displayName}](${repo.githubUrl})\n`;
      });
    } else {
      message += `\n⚠️ No repositories configured yet. Please add repositories to \`app/config/sonar-repos.json\`.\n`;
    }

    return message;
  };

  // Load chat history from localStorage on component mount
  useEffect(() => {
    const savedMessages = localStorage.getItem("chatHistory");
    const savedThreadId = localStorage.getItem("threadId");

    if (savedMessages) {
      try {
        const parsed = JSON.parse(savedMessages);
        setMessages(parsed);
      } catch (error) {
        console.error("Error parsing saved messages:", error);
        // Show welcome message if no valid saved messages
        setMessages([{
          role: "assistant",
          content: generateWelcomeMessage(),
          timestamp: new Date().toLocaleString()
        }]);
      }
    } else {
      // Show welcome message on first load
      setMessages([{
        role: "assistant",
        content: generateWelcomeMessage(),
        timestamp: new Date().toLocaleString()
      }]);
    }

    if (savedThreadId) {
      setThreadId(savedThreadId);
    }
  }, [availableRepos]);

  // Scroll to bottom when messages change
  useEffect(() => {
    chatContainerRef.current?.scrollTo({
      top: chatContainerRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  // Save chat history and thread ID in localStorage
  useEffect(() => {
    localStorage.setItem("chatHistory", JSON.stringify(messages));
    if (threadId) localStorage.setItem("threadId", threadId);
  }, [messages, threadId]);

  // Function to send user message and receive assistant response
// Replace your sendMessage function with this version
const sendMessage = async () => {
  if (activeRun || !input.trim()) return;

  setActiveRun(true);
  setLoading(true);

  const userMessage = {
    role: "user",
    content: input,
    timestamp: new Date().toLocaleString(),
  };
  setMessages((prev) => [...prev, userMessage]);
  const userInput = input;
  setInput("");

  try {
    setTyping(true);

    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: userInput,
        threadId: threadId,
      }),
    });

    // Check if response is ok first
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Get the response as text first to check if it's empty
    const responseText = await response.text();
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse JSON response:', responseText);
      throw new Error('Invalid JSON response from server');
    }

    // Check if the parsed data has an error
    if (data.error) {
      throw new Error(data.error);
    }

    // Update thread ID if we got a new one
    if (data.threadId && data.threadId !== threadId) {
      setThreadId(data.threadId);
    }

    // Add assistant response to messages
    setMessages((prev) => [
      ...prev,
      { 
        role: "assistant", 
        content: data.reply || "No response received", 
        timestamp: new Date().toLocaleString() 
      },
    ]);

  } catch (error: any) {
    console.error("Error:", error);
    
    let errorMessage = "Unable to reach assistant.";
    
    if (error.message) {
      errorMessage = error.message;
    }

    setMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        content: `Error: ${errorMessage}`,
        timestamp: new Date().toLocaleString(),
      },
    ]);
  } finally {
    setTyping(false);
    setLoading(false);
    setActiveRun(false);
  }
};

  // Handle repository link clicks
  const handleRepoLinkClick = async (url: string) => {
    if (activeRun || !url.trim()) return;

    setActiveRun(true);
    setLoading(true);

    const userMessage = {
      role: "user",
      content: url,
      timestamp: new Date().toLocaleString(),
    };
    setMessages((prev) => [...prev, userMessage]);

    try {
      setTyping(true);

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: url,
          threadId: threadId,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const responseText = await response.text();
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Failed to parse JSON response:', responseText);
        throw new Error('Invalid JSON response from server');
      }

      if (data.error) {
        throw new Error(data.error);
      }

      if (data.threadId && data.threadId !== threadId) {
        setThreadId(data.threadId);
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.reply || "No response received",
          timestamp: new Date().toLocaleString()
        },
      ]);

    } catch (error: any) {
      console.error("Error:", error);

      let errorMessage = "Unable to reach assistant.";

      if (error.message) {
        errorMessage = error.message;
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Error: ${errorMessage}`,
          timestamp: new Date().toLocaleString(),
        },
      ]);
    } finally {
      setTyping(false);
      setLoading(false);
      setActiveRun(false);
    }
  };

  // Copy chat to clipboard
  const copyChatToClipboard = async () => {
    const chatText = messages
      .map((msg) => `${msg.timestamp} - ${msg.role === "user" ? "You" : "GEA Cyber Bot"}:\n${msg.content}`)
      .join("\n\n");
    try {
      await navigator.clipboard.writeText(chatText);
      alert("Chat copied to clipboard!");
    } catch (err) {
      console.error("Failed to copy chat: ", err);
      alert("Failed to copy chat to clipboard.");
    }
  };

  return (
    <div className="h-screen w-full flex flex-col bg-white">
      {/* Header */}
      <header className="flex items-center justify-center w-full p-4 bg-white shadow-md">
        <img src="/icon.png" alt="Icon" className="h-12 w-12 sm:h-16 sm:w-16" />
        <h2 className="text-xl sm:text-2xl font-bold ml-2">GEA Cyber Bot</h2>
      </header>

      {/* Chat Container */}
      <div className="flex-grow w-full max-w-4xl mx-auto flex flex-col p-4">
        <div
          ref={chatContainerRef}
          className="flex-grow overflow-y-auto border p-3 space-y-4 bg-white shadow rounded-lg h-[65vh] sm:h-[70vh]"
        >
          {messages.map((msg, index) => (
            <motion.div key={index}>
              <p className="font-bold mb-1">
                {msg.role === "user" ? "You" : "GEA Cyber Bot"}{" "}
                {msg.timestamp && (
                  <span className="text-xs text-gray-500">({msg.timestamp})</span>
                )}
              </p>
              <div
                className={`p-3 rounded-md ${
                  msg.role === "user"
                    ? "bg-gray-200 text-black"
                    : "bg-white text-black border"
                }`}
              >
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    a: ({ href, children, ...props }) => {
                      // Check if this is a GitHub URL from our repo list
                      const isRepoLink = availableRepos.some(repo => repo.githubUrl === href);

                      // Check if this is a quick action link
                      const isQuickAction = href === '#what-capabilities' || href === '#add-repository';

                      if (isRepoLink && href) {
                        return (
                          <a
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              handleRepoLinkClick(href);
                            }}
                            style={{
                              color: "#2563eb",
                              textDecoration: "underline",
                              cursor: "pointer",
                              fontWeight: "600"
                            }}
                            {...props}
                          >
                            {children}
                          </a>
                        );
                      }

                      if (isQuickAction && href) {
                        return (
                          <a
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              const message = href === '#what-capabilities'
                                ? 'What can the Cyber Bot do?'
                                : 'How do I add a new repository?';
                              handleRepoLinkClick(message);
                            }}
                            style={{
                              color: "#2563eb",
                              textDecoration: "underline",
                              cursor: "pointer",
                              fontWeight: "600"
                            }}
                            {...props}
                          >
                            {children}
                          </a>
                        );
                      }

                      // Regular link
                      return (
                        <a
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: "#2563eb", textDecoration: "underline" }}
                          {...props}
                        >
                          {children}
                        </a>
                      );
                    },
                    h1: ({ ...props }) => (
                      <h1 style={{ fontFamily: "'Segoe UI', sans-serif", fontSize: "1.75rem", fontWeight: "bold", margin: "1rem 0", borderBottom: "2px solid #e5e7eb", paddingBottom: "0.5rem" }} {...props} />
                    ),
                    h2: ({ ...props }) => (
                      <h2 style={{ fontFamily: "'Segoe UI', sans-serif", fontSize: "1.5rem", fontWeight: "bold", margin: "1rem 0", color: "#1f2937" }} {...props} />
                    ),
                    h3: ({ ...props }) => (
                      <h3 style={{ fontFamily: "'Segoe UI', sans-serif", fontSize: "1.25rem", fontWeight: "bold", margin: "0.75rem 0", color: "#374151" }} {...props} />
                    ),
                    code: ({ className, children, ...props }: any) => {
                      const isCodeBlock = className?.includes('language-');
                      return isCodeBlock ? (
                        <code
                          className={className}
                          style={{
                            display: "block",
                            fontFamily: "'Consolas', 'Monaco', monospace",
                            background: "#1f2937",
                            color: "#f9fafb",
                            padding: "1rem",
                            borderRadius: "8px",
                            overflowX: "auto",
                            marginBottom: "1rem",
                            fontSize: "0.875rem",
                            lineHeight: "1.5"
                          }}
                          {...props}
                        >
                          {children}
                        </code>
                      ) : (
                        <code
                          style={{
                            fontFamily: "'Consolas', 'Monaco', monospace",
                            background: "#fee2e2",
                            color: "#991b1b",
                            padding: "0.2rem 0.4rem",
                            borderRadius: "4px",
                            fontSize: "0.875rem"
                          }}
                          {...props}
                        >
                          {children}
                        </code>
                      );
                    },
                    p: ({ node, ...props }) => (
                      <p style={{ marginBottom: "0.75rem", lineHeight: "1.6", fontFamily: "'Segoe UI', sans-serif", fontSize: "16px" }} {...props} />
                    ),
                    ul: ({ node, ...props }) => (
                      <ul style={{ listStyleType: "disc", paddingLeft: "1.5rem", marginBottom: "1rem" }} {...props} />
                    ),
                    ol: ({ node, ...props }) => (
                      <ol style={{ listStyleType: "decimal", paddingLeft: "1.5rem", marginBottom: "1rem" }} {...props} />
                    ),
                    li: ({ node, ...props }) => (
                      <li style={{ marginBottom: "0.4rem", lineHeight: "1.5" }} {...props} />
                    ),
                    table: ({ node, ...props }) => (
                      <div style={{ overflowX: "auto", marginBottom: "1rem" }}>
                        <table style={{ borderCollapse: "collapse", width: "100%", minWidth: "400px" }} {...props} />
                      </div>
                    ),
                    th: ({ node, ...props }) => (
                      <th style={{ border: "1px solid #d1d5db", background: "#f3f4f6", padding: "10px", textAlign: "left", fontWeight: "600", fontSize: "0.875rem" }} {...props} />
                    ),
                    td: ({ node, ...props }) => (
                      <td style={{ border: "1px solid #d1d5db", padding: "10px", textAlign: "left", fontSize: "0.875rem" }} {...props} />
                    ),
                    blockquote: ({ node, ...props }) => (
                      <blockquote style={{ borderLeft: "4px solid #3b82f6", paddingLeft: "1rem", marginLeft: "0", marginBottom: "1rem", color: "#4b5563", fontStyle: "italic" }} {...props} />
                    ),
                    strong: ({ node, ...props }) => (
                      <strong style={{ fontWeight: "700", color: "#111827" }} {...props} />
                    ),
                    hr: ({ node, ...props }) => (
                      <hr style={{ border: "none", borderTop: "1px solid #e5e7eb", margin: "1.5rem 0" }} {...props} />
                    ),
                  }}
                >
                  {msg.content}
                </ReactMarkdown>
              </div>
            </motion.div>
          ))}
          {/* Typing Indicator */}
          {typing && (
            <div className="text-gray-500 italic text-center p-2">Assistant is typing...</div>
          )}
        </div>
      </div>

      {/* Input & Controls */}
      <div className="w-full max-w-4xl mx-auto p-4 flex flex-col gap-2">
        <div className="flex flex-col sm:flex-row items-center gap-2">
          <input
            className="border rounded p-3 w-full sm:w-4/5"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Type a message or paste a GitHub URL to analyze..."
          />
          <button
            className="bg-blue-500 hover:bg-blue-600 text-white p-3 rounded w-full sm:w-1/5"
            onClick={sendMessage}
            disabled={loading}
          >
            {loading ? "..." : "Send"}
          </button>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            className="bg-yellow-500 hover:bg-yellow-600 text-white p-3 rounded w-full"
            onClick={copyChatToClipboard}
          >
            Copy Chat
          </button>
          <button
            className="bg-red-400 hover:bg-red-500 text-white p-3 rounded w-full"
            onClick={() => {
              setMessages([{
                role: "assistant",
                content: generateWelcomeMessage(),
                timestamp: new Date().toLocaleString()
              }]);
              setThreadId(null);
              localStorage.removeItem("threadId");
              localStorage.removeItem("chatHistory");
            }}
          >
            Clear Chat
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatApp;