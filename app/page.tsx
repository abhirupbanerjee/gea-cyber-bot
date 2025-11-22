"use client";

// Import necessary libraries and modules
import React, { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import { motion } from "framer-motion";
import remarkGfm from "remark-gfm";
import { User, Bot, Copy, Check, ExternalLink, Send, Trash2, ClipboardCopy, Shield } from "lucide-react";

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
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [showWelcome, setShowWelcome] = useState(true);
  const [availableRepos, setAvailableRepos] = useState<Array<{githubUrl: string; displayName: string}>>([]);
  const [reposLoaded, setReposLoaded] = useState(false);
  const [reposError, setReposError] = useState<string | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Fetch available repositories from config
  useEffect(() => {
    const fetchRepos = async () => {
      try {
        console.log('[ChatApp] Fetching repositories from /api/sonar/list-repos');
        const res = await fetch('/api/sonar/list-repos');

        if (!res.ok) {
          throw new Error(`Failed to fetch repositories: ${res.status} ${res.statusText}`);
        }

        const data = await res.json();
        console.log('[ChatApp] API Response:', data);

        if (data.success && data.repos) {
          const configuredRepos = data.repos.filter((r: any) => r.configured);
          setAvailableRepos(configuredRepos);
          console.log(`[ChatApp] Loaded ${configuredRepos.length} configured repositories`);

          if (configuredRepos.length === 0) {
            setReposError('No repositories marked as "configured: true" in sonar-repos.json');
          }
        } else {
          throw new Error(data.error || 'Unknown error loading repositories');
        }
      } catch (err: any) {
        const errorMsg = err.message || 'Failed to load repositories';
        console.error('[ChatApp] Repository loading error:', errorMsg);
        setReposError(errorMsg);
      } finally {
        setReposLoaded(true);
      }
    };

    fetchRepos();
  }, []);

  // Load chat history from localStorage on component mount
  useEffect(() => {
    const savedMessages = localStorage.getItem("chatHistory");
    const savedThreadId = localStorage.getItem("threadId");

    if (savedMessages) {
      try {
        const parsedMessages = JSON.parse(savedMessages);
        setMessages(parsedMessages);
        // Hide welcome if there are existing messages
        if (parsedMessages.length > 0) {
          setShowWelcome(false);
        }
      } catch (error) {
        console.error("Error parsing saved messages:", error);
      }
    }

    if (savedThreadId) {
      setThreadId(savedThreadId);
    }
  }, [reposLoaded]);

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
  const sendMessage = async () => {
    if (activeRun || !input.trim()) return;

    // Hide welcome screen on first message
    if (showWelcome) {
      setShowWelcome(false);
    }

    setActiveRun(true);
    setLoading(true);

    const userMessage = {
      role: "user",
      content: input,
      timestamp: new Date().toLocaleString(),
    };
    setMessages((prev) => [...prev, userMessage]);

    const inputToSend = input;
    setInput("");

    try {
      setTyping(true);

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputToSend,
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

    // Hide welcome screen
    if (showWelcome) {
      setShowWelcome(false);
    }

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

  // Copy individual message to clipboard
  const copyMessageToClipboard = async (content: string, index: number) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000); // Show checkmark for 2s
    } catch (err) {
      console.error("Failed to copy message: ", err);
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
      <div className="flex-1 w-full max-w-4xl mx-auto flex flex-col p-4 overflow-hidden">
        <div
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto border p-3 bg-white shadow rounded-lg"
        >
          <div className="space-y-4">
            {/* Welcome Screen */}
            {showWelcome && messages.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="flex flex-col items-center justify-center h-full p-6"
              >
                {/* Welcome Icon */}
                <div className="mb-6">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center shadow-lg">
                    <Shield className="w-12 h-12 text-white" />
                  </div>
                </div>

                {/* Welcome Message */}
                <div className="text-center max-w-2xl mb-8">
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
                    Welcome to GEA Cyber Bot
                  </h2>
                  <p className="text-gray-600 text-lg mb-6">
                    I'm your AI-powered assistant for code quality and security analysis
                  </p>
                </div>

                {/* Quick Actions */}
                <div className="w-full max-w-2xl mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
                    Quick Actions
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      onClick={() => {
                        setInput("What can the Cyber Bot do?");
                        setShowWelcome(false);
                      }}
                      className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-all text-left group"
                    >
                      <p className="text-purple-700 font-medium group-hover:text-purple-800">
                        📖 What can the Cyber Bot do?
                      </p>
                    </button>
                    <button
                      onClick={() => {
                        setInput("How do I add a new repository?");
                        setShowWelcome(false);
                      }}
                      className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-all text-left group"
                    >
                      <p className="text-purple-700 font-medium group-hover:text-purple-800">
                        ➕ How do I add a new repository?
                      </p>
                    </button>
                  </div>
                </div>

                {/* Repository Cards */}
                {reposLoaded && !reposError && availableRepos.length > 0 && (
                  <div className="w-full max-w-3xl mb-8">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
                      Available Repositories ({availableRepos.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {availableRepos.map((repo, idx) => {
                        // Remove "https://github.com/abhirupbanerjee/" from URL display
                        const cleanUrl = repo.githubUrl.replace('https://github.com/abhirupbanerjee/', '');

                        return (
                          <button
                            key={idx}
                            onClick={() => handleRepoLinkClick(repo.githubUrl)}
                            className="bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-all text-left group"
                          >
                            <div className="flex items-start gap-3">
                              <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center flex-shrink-0">
                                <span className="text-white font-bold text-lg">{idx + 1}</span>
                              </div>
                              <div className="flex-1">
                                <h4 className="font-bold text-gray-900 text-base mb-1 group-hover:text-emerald-700 transition-colors">
                                  {repo.displayName}
                                </h4>
                                <p className="text-xs text-gray-600 truncate">
                                  {cleanUrl}
                                </p>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Error Message */}
                {reposError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-2xl mb-6">
                    <p className="text-red-800 text-sm">
                      <strong>⚠️ Configuration Issue:</strong> {reposError}
                    </p>
                  </div>
                )}

                {/* Or Start Typing */}
                <p className="text-gray-500 text-sm">
                  Or type your question below to get started
                </p>
              </motion.div>
            )}

            {/* Messages */}
            {messages.map((msg, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="group"
              >
                {/* Message Header with Avatar */}
                <div className="flex items-center gap-2 mb-2">
                  {/* Avatar */}
                  <div
                    className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                      msg.role === "user"
                        ? "bg-blue-600"
                        : "bg-gradient-to-br from-blue-600 to-cyan-600"
                    }`}
                  >
                    {msg.role === "user" ? (
                      <User className="w-5 h-5 text-white" />
                    ) : (
                      <Bot className="w-5 h-5 text-white" />
                    )}
                  </div>

                  {/* Name and Timestamp */}
                  <div className="flex-grow flex items-center justify-between">
                    <span className="font-semibold text-gray-900">
                      {msg.role === "user" ? "You" : "GEA Cyber Bot"}
                    </span>
                    <div className="flex items-center gap-2">
                      {msg.timestamp && (
                        <span className="text-xs text-gray-500">{msg.timestamp}</span>
                      )}
                      {/* Copy Button - Shows on hover */}
                      <button
                        onClick={() => copyMessageToClipboard(msg.content, index)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-gray-100 rounded"
                        aria-label="Copy message"
                      >
                        {copiedIndex === index ? (
                          <Check className="w-4 h-4 text-green-600" />
                        ) : (
                          <Copy className="w-4 h-4 text-gray-600" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Message Content */}
                <div
                  className={`p-4 rounded-lg ml-10 ${
                    msg.role === "user"
                      ? "bg-blue-50 border border-blue-100"
                      : "bg-white border border-gray-200 shadow-sm"
                  }`}
                >
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      a: ({ href, children, ...props }) => {
                        // Check if this is a GitHub URL from our repo list
                        const isRepoLink = availableRepos.some(repo => repo.githubUrl === href);

                        if (isRepoLink && href) {
                          return (
                            <a
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                handleRepoLinkClick(href);
                              }}
                              className="text-blue-600 hover:text-blue-800 underline font-semibold cursor-pointer"
                              {...props}
                            >
                              {children}
                            </a>
                          );
                        }

                        // Regular external link
                        return (
                          <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 underline inline-flex items-center gap-1 group/link"
                            {...props}
                          >
                            {children}
                            <ExternalLink className="w-3 h-3 opacity-0 group-hover/link:opacity-100 transition-opacity" />
                          </a>
                        );
                      },
                      h1: ({ ...props }) => (
                        <h1 className="text-2xl font-bold mb-3 mt-4 first:mt-0 text-gray-900" {...props} />
                      ),
                      h2: ({ ...props }) => (
                        <h2 className="text-xl font-bold mb-3 mt-3 first:mt-0 text-gray-900" {...props} />
                      ),
                      h3: ({ ...props }) => (
                        <h3 className="text-lg font-semibold mb-2 mt-3 first:mt-0 text-gray-900" {...props} />
                      ),
                      h4: ({ ...props }) => (
                        <h4 className="text-base font-semibold mb-2 mt-2 first:mt-0 text-gray-900" {...props} />
                      ),
                      code: ({ node, inline, className, children, ...props }: any) => {
                        // CRITICAL FIX: Use inline prop instead of className check
                        if (inline) {
                          return (
                            <code className="bg-gray-100 text-red-600 px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
                              {children}
                            </code>
                          );
                        }
                        // Block code
                        return (
                          <code className="block bg-gray-900 text-gray-100 p-3 rounded-lg overflow-x-auto text-sm font-mono my-2" {...props}>
                            {children}
                          </code>
                        );
                      },
                      p: ({ ...props }) => (
                        <p className="mb-3 leading-relaxed text-gray-800 last:mb-0" {...props} />
                      ),
                      ul: ({ ...props }) => (
                        <ul className="list-disc pl-6 mb-3 space-y-1" {...props} />
                      ),
                      ol: ({ ...props }) => (
                        <ol className="list-decimal pl-6 mb-3 space-y-1" {...props} />
                      ),
                      li: ({ ...props }) => (
                        <li className="text-gray-800 leading-relaxed" {...props} />
                      ),
                      table: ({ ...props }) => (
                        <div className="overflow-x-auto my-3">
                          <table className="min-w-full border-collapse border border-gray-300" {...props} />
                        </div>
                      ),
                      thead: ({ ...props }) => (
                        <thead {...props} />
                      ),
                      tbody: ({ ...props }) => (
                        <tbody {...props} />
                      ),
                      th: ({ ...props }) => (
                        <th className="border border-gray-300 bg-gray-100 px-4 py-2 text-left font-semibold" {...props} />
                      ),
                      td: ({ ...props }) => (
                        <td className="border border-gray-300 px-4 py-2" {...props} />
                      ),
                      blockquote: ({ ...props }) => (
                        <blockquote className="border-l-4 border-gray-300 pl-4 py-2 my-3 italic text-gray-700 bg-gray-50 rounded-r" {...props} />
                      ),
                      strong: ({ ...props }) => (
                        <strong className="font-bold text-gray-900" {...props} />
                      ),
                      hr: ({ ...props }) => (
                        <hr className="my-4 border-gray-300" {...props} />
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
              <div className="flex items-center gap-2 text-gray-500 italic p-2">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
                <span>Assistant is typing...</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Input & Controls */}
      <div className="w-full max-w-4xl mx-auto p-4 flex flex-col gap-3">
        {/* Input Row */}
        <div className="flex flex-col sm:flex-row items-stretch gap-2">
          <input
            className="flex-1 border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg px-4 py-3 outline-none transition-all"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !loading && sendMessage()}
            placeholder="Type a message or paste a GitHub URL to analyze..."
            disabled={loading}
          />
          <button
            className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-all shadow-sm hover:shadow-md sm:min-w-[120px]"
            onClick={sendMessage}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="animate-spin">⏳</span>
                <span>Sending...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Send</span>
              </>
            )}
          </button>
        </div>

        {/* Action Buttons Row */}
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            className="flex-1 bg-white hover:bg-gray-50 border-2 border-gray-300 hover:border-gray-400 text-gray-700 px-4 py-2.5 rounded-lg font-medium flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={copyChatToClipboard}
            disabled={messages.length === 0}
          >
            <ClipboardCopy className="w-4 h-4" />
            <span>Copy Chat</span>
          </button>
          <button
            className="flex-1 bg-white hover:bg-red-50 border-2 border-gray-300 hover:border-red-400 text-gray-700 hover:text-red-600 px-4 py-2.5 rounded-lg font-medium flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => {
              setMessages([]);
              setThreadId(null);
              setShowWelcome(true);
              localStorage.removeItem("threadId");
              localStorage.removeItem("chatHistory");
            }}
            disabled={messages.length === 0}
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear Chat</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatApp;
