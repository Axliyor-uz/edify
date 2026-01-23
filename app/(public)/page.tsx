'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Rocket, 
  BookOpen, 
  Calculator, 
  Globe, 
  Brain, 
  Palette, 
  Zap, 
  Star, 
  Users, 
  Shield, 
  TrendingUp,
  ChevronRight,
  Menu,
  X,
  Send,
  MapPin,
  Mail,
  Phone,
  Github,
  Twitter,
  Linkedin,
  CheckCircle,
  BarChart3,
  Eye
} from 'lucide-react';
import Link from 'next/link';

// --- DATA CONFIGURATION ---

const features = [
  {
    icon: Calculator,
    title: "Mathematics",
    description: "LaTeX support for complex formulas, step-by-step solutions, and auto-grading for teachers.",
    gradient: "from-blue-500 to-cyan-500",
    delay: 0.1
  },
  {
    icon: BookOpen,
    title: "Literature",
    description: "Reading comprehension tests with rich text analysis and automated essay scoring assistance.",
    gradient: "from-emerald-500 to-teal-500",
    delay: 0.2
  },
  {
    icon: Brain,
    title: "Science",
    description: "Diagram-based questions for Biology, Physics, and Chemistry with interactive visual aids.",
    gradient: "from-purple-500 to-pink-500",
    delay: 0.3
  },
  {
    icon: Globe,
    title: "Languages",
    description: "Multilingual assessment support (Uzbek, Russian, English) for vocabulary and grammar.",
    gradient: "from-orange-500 to-red-500",
    delay: 0.4
  },
  {
    icon: Palette,
    title: "Arts & History",
    description: "Visual identification quizzes and timeline-based assessments for humanities.",
    gradient: "from-indigo-500 to-violet-500",
    delay: 0.5
  },
  {
    icon: Eye,
    title: "Integrity",
    description: "Advanced proctoring features to ensure exam security and student honesty.",
    gradient: "from-rose-500 to-pink-500",
    delay: 0.6
  }
];

const benefits = [
  {
    icon: Users,
    title: "For Teachers",
    description: "Create custom tests in seconds, manage rosters, and export gradebooks effortlessly."
  },
  {
    icon: Shield,
    title: "Secure Testing",
    description: "Focus-mode, tab-switching detection, and randomized questions to prevent cheating."
  },
  {
    icon: BarChart3,
    title: "For Students",
    description: "Track your personal progress, identify weak spots, and master subjects at your own pace."
  },
  {
    icon: Zap,
    title: "Real-time Results",
    description: "Instant grading and feedback for students, detailed analytics for educators."
  }
];

export default function LandingPage() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [activeFeature, setActiveFeature] = useState(0);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % features.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white overflow-hidden relative">
      
      {/* --- 1. ANIMATED BACKGROUND (Exact Copy) --- */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {/* Gradient Orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" />
        <div className="absolute top-3/4 right-1/4 w-96 h-96 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse animation-delay-2000" />
        <div className="absolute bottom-1/4 left-1/2 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse animation-delay-4000" />
        
        {/* Mouse Follower */}
        <motion.div
          className="fixed w-80 h-80 bg-gradient-to-r from-purple-400/20 to-cyan-400/20 rounded-full blur-3xl pointer-events-none"
          animate={{
            x: mousePosition.x - 160,
            y: mousePosition.y - 160,
          }}
          transition={{
            type: "spring",
            stiffness: 100,
            damping: 20,
          }}
        />
      </div>

      {/* --- 2. MAIN CONTENT --- */}
      {/* Note: Padding top added because Navbar in layout is fixed */}
      <main className="flex-1 pt-24 lg:pt-32 relative z-10">
        
        {/* HERO SECTION */}
        <section className="max-w-7xl mx-auto px-4 lg:px-6 py-20 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            
            {/* Left: Text */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="text-5xl lg:text-7xl font-black leading-tight mb-6">
                The Platform for
                <span className="block bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Modern Education
                </span>
              </h1>
              <p className="text-xl text-slate-300 mb-8 leading-relaxed max-w-lg">
                Edify connects teachers and students. Create powerful assessments in minutes, automate grading, and help every student master their subjects.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/auth/signup">
                    <motion.button 
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full sm:w-auto group relative overflow-hidden bg-gradient-to-r from-cyan-500 to-purple-500 text-white px-8 py-4 rounded-xl text-lg font-bold shadow-lg hover:shadow-cyan-500/30 transition-all duration-300 flex items-center justify-center gap-2"
                    >
                      <span className="relative z-10">Start as Teacher / Student</span>
                      <ChevronRight size={20} className="relative z-10 group-hover:translate-x-1 transition-transform duration-200"/>
                    </motion.button>
                </Link>
                <Link href="/auth/login">
                    <motion.button 
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full sm:w-auto border-2 border-slate-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:border-cyan-400 hover:text-cyan-400 transition-all duration-300"
                    >
                      Log In
                    </motion.button>
                </Link>
              </div>
            </motion.div>
            
            {/* Right: Floating Card Animation */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative hidden lg:block"
            >
              <div className="relative bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 shadow-2xl">
                {/* Feature Grid Preview */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  {features.slice(0, 6).map((feature, index) => (
                    <motion.div
                      key={index}
                      className={`p-4 rounded-2xl bg-gradient-to-br ${feature.gradient} bg-opacity-20 border border-white/10`}
                      animate={{
                        scale: activeFeature === index ? 1.05 : 1,
                        y: activeFeature === index ? -10 : 0
                      }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    >
                      <feature.icon className="w-8 h-8 mb-2" />
                      <h3 className="font-bold text-[10px] uppercase tracking-wider">{feature.title}</h3>
                    </motion.div>
                  ))}
                </div>
                
                {/* Score Card */}
                <div className="bg-slate-900/50 rounded-2xl p-6 border border-slate-700/50 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    </div>
                    <span className="text-xs text-slate-400 font-mono">Status: Active</span>
                  </div>
                  <div className="text-right">
                      <Star className="w-8 h-8 text-cyan-400 inline-block mb-1" fill="currentColor" />
                      <div className="text-xs font-bold text-white">Perfect Score</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* FEATURES SECTION */}
        <section id="features" className="max-w-7xl mx-auto px-4 lg:px-6 py-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl lg:text-5xl font-black mb-6">
              Empowering Every Classroom
            </h2>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto">
              Whether you are teaching Mathematics or learning Languages, Edify provides the tools to succeed.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: feature.delay }}
                className="group relative bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 hover:border-cyan-500/30 transition-all duration-300 hover:transform hover:scale-105"
              >
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4">{feature.title}</h3>
                <p className="text-slate-300 leading-relaxed">{feature.description}</p>
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-purple-500/10 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </motion.div>
            ))}
          </div>
        </section>

        {/* BENEFITS SECTION */}
        <section id="benefits" className="max-w-7xl mx-auto px-4 lg:px-6 py-20 bg-slate-800/30 backdrop-blur-xl rounded-3xl my-20 border border-slate-700/30">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl lg:text-5xl font-black mb-6">
              Built for the Wasp-2 Ecosystem
            </h2>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto">
              Seamlessly integrating Teacher, Student, and Parent experiences.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center p-6 bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-3xl hover:border-cyan-500/30 transition-all duration-300"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-purple-500/20">
                  <benefit.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-4">{benefit.title}</h3>
                <p className="text-slate-300">{benefit.description}</p>
              </motion.div>
            ))}
          </div>
        </section>
      </main>

      {/* --- 3. UPDATED FOOTER --- */}
      <footer className="bg-slate-900/80 backdrop-blur-xl border-t border-slate-700/50 pt-16 pb-8 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          {/* Changed grid to 3 columns since Support is removed */}
          <div className="grid md:grid-cols-3 gap-12 mb-12">
            
            {/* 1. Company Info & Socials */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 bg-gradient-to-br from-cyan-500 to-purple-500 rounded-xl flex items-center justify-center">
                  <Rocket className="w-6 h-6 text-white" />
                </div>
                <span className="font-black text-xl bg-gradient-to-r from-white to-cyan-400 bg-clip-text text-transparent">
                  Edify.
                </span>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed mb-6 max-w-sm">
                Powered by Wasp-2 AI. Creating the next generation of assessment tools for Schools and beyond.
              </p>
              
              {/* Social Icons */}
              <div className="flex gap-4">
                <motion.a 
                  href="https://github.com/umidjon0339" 
                  target="_blank"
                  className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                  whileHover={{ y: -3 }}
                >
                  <Github className="w-5 h-5" />
                </motion.a>
                <motion.a 
                  href="https://www.linkedin.com/company/wasp-2-ai" 
                  className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 hover:text-blue-400 hover:bg-slate-700 transition-colors"
                  whileHover={{ y: -3 }}
                >
                  <Linkedin className="w-5 h-5" />
                </motion.a>
                <motion.a 
                  href="https://t.me/u_m_i_d_j_o_n_006" 
                  className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 hover:text-cyan-400 hover:bg-slate-700 transition-colors"
                  whileHover={{ y: -3 }}
                >
                  <Send className="w-5 h-5 -ml-0.5 mt-0.5" /> {/* Telegram Icon */}
                </motion.a>
              </div>
            </div>

            {/* 2. Platform Links */}
            <div>
              <h3 className="text-lg font-bold mb-6 text-white">Platform</h3>
              <ul className="space-y-3">
                {['For Teachers', 'For Students', 'Features', 'Pricing', 'Login'].map((link) => (
                  <motion.li key={link}>
                    <a href="#" className="text-slate-400 hover:text-cyan-400 transition-colors hover:underline">
                      {link}
                    </a>
                  </motion.li>
                ))}
              </ul>
            </div>

            {/* 3. Contact & Map */}
            <div>
              <h3 className="text-lg font-bold mb-6 text-white">Contact</h3>
              <div className="space-y-4 mb-6">
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-cyan-400 shrink-0" />
                  <span className="text-slate-400 text-sm">Afrosiyob koʻchasi, 15/2, Tashkent</span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-cyan-400 shrink-0" />
                  <span className="text-slate-400 text-sm">info@wasp-2.com</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-cyan-400 shrink-0" />
                  <span className="text-slate-400 text-sm">+998 55 510 20 01</span>
                </div>
              </div>
              
              {/* Interactive Map Embed (Specific Coordinates) */}
              <div className="rounded-xl overflow-hidden h-40 w-full border border-slate-700/50 shadow-lg grayscale hover:grayscale-0 transition-all duration-500 relative group">
                <iframe 
                  src="https://maps.google.com/maps?q=41.296837,69.272712&t=&z=15&ie=UTF8&iwloc=&output=embed" 
                  width="100%" 
                  height="100%" 
                  style={{ border: 0 }} 
                  allowFullScreen 
                  loading="lazy"
                  className="opacity-70 group-hover:opacity-100 transition-opacity"
                ></iframe>
              </div>
            </div>
          </div>
          
          <div className="pt-8 border-t border-slate-700/50 text-center text-slate-500 text-sm">
            <p>&copy; {new Date().getFullYear()} Wasp-2 AI Solutions. All rights reserved.</p>
          </div>
        </div>
      </footer>

    </div>
  );
}