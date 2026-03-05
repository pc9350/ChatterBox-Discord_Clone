"use client";

import { SignUp } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { motion } from "framer-motion";
import { MessageSquare, Zap, Shield, Users } from "lucide-react";

const features = [
  { icon: MessageSquare, label: "Real-time DMs" },
  { icon: Zap, label: "Instant delivery" },
  { icon: Shield, label: "Secure & private" },
  { icon: Users, label: "Friends system" },
];

const clerkAppearance = {
  baseTheme: dark,
  variables: {
    colorBackground: "#0f1117",
    colorInputBackground: "#1a1d2e",
    colorInputText: "#e2e8f0",
    colorText: "#e2e8f0",
    colorTextSecondary: "#94a3b8",
    colorPrimary: "#6366f1",
    colorDanger: "#f87171",
    borderRadius: "0.75rem",
    fontFamily: "inherit",
  },
  elements: {
    card: {
      background: "#0f1117",
      border: "1px solid rgba(99,102,241,0.2)",
      boxShadow: "0 0 40px rgba(99,102,241,0.08), 0 8px 32px rgba(0,0,0,0.4)",
      borderRadius: "1rem",
    },
    headerTitle: {
      color: "#f1f5f9",
      fontWeight: "700",
    },
    headerSubtitle: {
      color: "#64748b",
    },
    socialButtonsBlockButton: {
      background: "#1a1d2e",
      border: "1px solid rgba(255,255,255,0.08)",
      color: "#e2e8f0",
    },
    dividerLine: { background: "rgba(255,255,255,0.06)" },
    dividerText: { color: "#475569" },
    formFieldLabel: { color: "#94a3b8", fontSize: "0.8125rem" },
    formFieldInput: {
      background: "#1a1d2e",
      border: "1px solid rgba(255,255,255,0.08)",
      color: "#f1f5f9",
    },
    formButtonPrimary: {
      background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
      boxShadow: "0 4px 14px rgba(99,102,241,0.4)",
    },
    footerActionLink: { color: "#818cf8" },
    identityPreviewText: { color: "#94a3b8" },
    identityPreviewEditButton: { color: "#818cf8" },
  },
};

export default function SignUpPage() {
  return (
    <div className="flex h-screen w-full bg-[#080a12] overflow-hidden relative">
      {/* Grid background */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(99,102,241,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.04)_1px,transparent_1px)] bg-[size:64px_64px]" />

      {/* Gradient orbs */}
      <div className="absolute top-[-15%] right-[-8%] w-[600px] h-[600px] rounded-full bg-violet-600/15 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-15%] left-[-8%] w-[500px] h-[500px] rounded-full bg-indigo-600/10 blur-[110px] pointer-events-none" />

      {/* Left panel — styled Clerk */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
        className="flex flex-col items-center justify-center flex-1 relative z-10 px-4"
      >
        <SignUp appearance={clerkAppearance} />
      </motion.div>

      {/* Right branding panel */}
      <motion.div
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="hidden lg:flex flex-col justify-center px-20 flex-1 relative z-10"
      >
        {/* Logo */}
        <div className="flex items-center gap-3 mb-12">
          <div className="size-11 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-xl shadow-indigo-500/30">
            <MessageSquare className="size-5 text-white" />
          </div>
          <span className="text-2xl font-bold text-white tracking-tight">
            ChatterBox
          </span>
        </div>

        <h1 className="text-[3.5rem] font-extrabold text-white leading-[1.1] mb-5 tracking-tight">
          Join the
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">
            conversation.
          </span>
        </h1>
        <p className="text-slate-400 text-lg max-w-sm mb-14 leading-relaxed">
          Create your account in seconds and start chatting with friends right away.
        </p>

        <div className="grid grid-cols-2 gap-3 max-w-[280px]">
          {features.map(({ icon: Icon, label }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 + i * 0.08 }}
              className="flex items-center gap-2.5 bg-white/[0.04] border border-white/[0.07] rounded-xl px-3.5 py-3 backdrop-blur-sm"
            >
              <Icon className="size-3.5 text-indigo-400 shrink-0" />
              <span className="text-xs text-slate-300 font-medium">{label}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
