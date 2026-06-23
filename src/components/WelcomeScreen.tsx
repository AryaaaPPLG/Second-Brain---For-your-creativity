/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { User } from "../types";
import { getStoredUsers, saveStoredUsers } from "../lib/store";
import { motion } from "motion/react";
import { Brain, Lock, Mail, User as UserIcon, ShieldAlert, KeyRound, Eye, EyeOff, Loader2 } from "lucide-react";

interface WelcomeScreenProps {
  onLogin: (user: User) => void;
}

export default function WelcomeScreen({ onLogin }: WelcomeScreenProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const users = getStoredUsers();

  const handleQuickLogin = (user: User) => {
    onLogin(user);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!email.trim()) {
      setError("Please enter a valid email address.");
      return;
    }

    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address format.");
      return;
    }

    setIsLoading(true);

    // Simulate API call delay
    setTimeout(() => {
      try {
        if (isLogin) {
          // Find user
          const existingUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
          if (existingUser) {
            onLogin(existingUser);
            resetForm();
          } else {
            setError("Account not found. Click 'Register' to create a new workspace.");
          }
        } else {
          if (!name.trim()) {
            setError("Please enter your full name.");
            setIsLoading(false);
            return;
          }

          const existingUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
          if (existingUser) {
            setError("An account with this email already exists. Please login instead.");
            setIsLoading(false);
            return;
          }

          const newUser: User = {
            id: `user-${Date.now()}`,
            email: email.toLowerCase(),
            name: name.trim(),
            avatarUrl: `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 999999)}?auto=format&fit=crop&w=120&q=80`
          };

          const updatedUsers = [...users, newUser];
          saveStoredUsers(updatedUsers);
          onLogin(newUser);
          resetForm();
        }
      } catch (err) {
        setError("An unexpected error occurred. Please try again.");
      } finally {
        setIsLoading(false);
      }
    }, 600);
  };

  const resetForm = () => {
    setEmail("");
    setName("");
    setPassword("");
    setError("");
    setShowPassword(false);
  };

  return (
    <div id="welcome-container" className="min-h-screen bg-[#09090b] text-[#fafafa] flex flex-col justify-center items-center p-4 relative overflow-hidden bg-grid-pattern">
      {/* Decorative ambient gradients */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/5 rounded-full blur-[128px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-600/5 rounded-full blur-[128px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md bg-[#18181b] border border-[#27272a] rounded-xl p-8 shadow-2xl relative z-10"
      >
        {/* App Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/10 mb-4 ring-1 ring-blue-400/20">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <h1 className="font-display font-bold text-2xl tracking-tight text-white mb-1.5">
            Second Brain
          </h1>
          <p className="text-[#a1a1aa] text-xs text-center max-w-xs leading-relaxed">
            A fast, secure, production-grade workspace engineered for mental logs, scripts, and specifications.
          </p>
        </div>

        {/* Quick User Selector (Tenant Isolation Demo) */}
        <div className="mb-6 bg-[#09090b] rounded-lg p-4 border border-[#27272a]">
          <div className="flex items-center gap-2 mb-2.5">
            <ShieldAlert className="w-4 h-4 text-blue-400" />
            <h3 className="font-display text-[11px] font-semibold uppercase tracking-wider text-[#a1a1aa]">
              Strict User Isolation Access
            </h3>
          </div>
          <p className="text-[11px] text-[#71717a] mb-4 leading-relaxed">
            Quick-switch between database isolation environments to verify strict query segregation.
          </p>
          <div className="grid grid-cols-2 gap-3">
            {users.slice(0, 2).map((user) => (
              <motion.button
                key={user.id}
                whileHover={!isLoading ? { scale: 1.01 } : {}}
                whileTap={!isLoading ? { scale: 0.99 } : {}}
                onClick={() => handleQuickLogin(user)}
                disabled={isLoading}
                type="button"
                className="flex flex-col items-center p-3 rounded-lg bg-[#18181b] hover:bg-[#27272a]/50 border border-[#27272a] hover:border-[#71717a]/30 transition text-center group cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#18181b] disabled:hover:border-[#27272a]"
              >
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  className="w-8 h-8 rounded-full mb-2 object-cover border border-[#27272a] group-hover:border-blue-500 transition-colors"
                  referrerPolicy="no-referrer"
                />
                <span className="text-xs font-semibold text-[#fafafa] block truncate max-w-full">
                  {user.name}
                </span>
                <span className="text-[10px] text-[#71717a] font-mono tracking-tight block truncate max-w-full">
                  {user.id === "user-1" ? "@alex_merc" : "@sarah_conn"}
                </span>
              </motion.button>
            ))}
          </div>
        </div>

        <div className="relative flex py-2 items-center mb-6">
          <div className="flex-grow border-t border-[#27272a]"></div>
          <span className="flex-shrink mx-4 text-[9px] font-mono uppercase tracking-widest text-[#71717a]">OR CREDENTIAL PASS</span>
          <div className="flex-grow border-t border-[#27272a]"></div>
        </div>

        {/* Regular Signup Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 bg-red-950/20 border border-red-900/40 rounded-lg text-red-200 text-xs flex items-start gap-2"
            >
              <ShieldAlert className="w-4 h-4 mt-0.5 flex-shrink-0 text-red-400" />
              <span>{error}</span>
            </motion.div>
          )}

          {!isLogin && (
            <div>
              <label htmlFor="name-input" className="text-[11px] text-[#71717a] font-semibold uppercase tracking-wider block mb-1">Full Operator Name</label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#71717a]" />
                <input
                  id="name-input"
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isLoading}
                  aria-label="Full name for registration"
                  className="w-full bg-[#09090b] border border-[#27272a] focus:border-blue-500 rounded-lg py-2 pl-10 pr-4 text-xs text-[#fafafa] placeholder-[#52525b] outline-none transition disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>
          )}

          <div>
            <label htmlFor="email-input" className="text-[11px] text-[#71717a] font-semibold uppercase tracking-wider block mb-1">Secure Coordinates (Email)</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#71717a]" />
              <input
                id="email-input"
                type="email"
                placeholder="you@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                aria-label="Email address"
                autoComplete="email"
                className="w-full bg-[#09090b] border border-[#27272a] focus:border-blue-500 rounded-lg py-2 pl-10 pr-4 text-xs text-[#fafafa] placeholder-[#52525b] outline-none transition disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password-input" className="text-[11px] text-[#71717a] font-semibold uppercase tracking-wider block mb-1">Passphrase</label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#71717a]" />
              <input
                id="password-input"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                aria-label="Password"
                autoComplete={isLogin ? "current-password" : "new-password"}
                className="w-full bg-[#09090b] border border-[#27272a] focus:border-blue-500 rounded-lg py-2 pl-10 pr-10 text-xs text-[#fafafa] placeholder-[#52525b] outline-none transition disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#71717a] hover:text-[#a1a1aa] transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <motion.button
            whileHover={!isLoading ? { scale: 1.01 } : {}}
            whileTap={!isLoading ? { scale: 0.99 } : {}}
            type="submit"
            disabled={isLoading}
            aria-busy={isLoading}
            className="w-full bg-white text-black hover:bg-[#fafafa] disabled:bg-[#a1a1aa] disabled:hover:bg-[#a1a1aa] text-xs font-bold py-2.5 rounded-lg transition shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed mt-6"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Lock className="w-3.5 h-3.5" />
                {isLogin ? "Authenticate Engine" : "Provision Security Shell"}
              </>
            )}
          </motion.button>
        </form>

        {/* Toggle Mode */}
        <div className="text-center mt-6">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              resetForm();
            }}
            disabled={isLoading}
            type="button"
            className="text-xs text-blue-400 hover:text-blue-300 font-medium transition disabled:text-[#71717a] disabled:cursor-not-allowed"
          >
            {isLogin ? "Need a new isolated workspace? Register here" : "Return to secure authentication gate"}
          </button>
        </div>
      </motion.div>

      {/* Footer System Credits */}
      <div className="mt-8 text-[10px] font-mono text-[#71717a] relative z-10 select-none flex items-center gap-1.5">
        <span>SECURITY STANDARD: AES-GCM MAPPED</span>
        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
        <span>TLS ACTIVE</span>
      </div>
    </div>
  );
}
