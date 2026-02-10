"use client"

import type React from "react"
import { useState } from "react"
import { useSociety } from "@/context/SocietyContext"
import { supabase } from "@/lib/supabase"
import { Link, useLocation } from "wouter"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { Info, Briefcase, ShieldAlert, Phone, Loader2 } from "lucide-react"

// ASSETS
import logoUpdate from "@assets/generated_images/SwapnoDinga_Logo_Update.png"
import heroBg from "@assets/generated_images/housing_community_hero_background.png"

export default function LandingPage() {
  const { register } = useSociety()
  const [, setLocation] = useLocation()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [regName, setRegName] = useState("")
  const [regEmail, setRegEmail] = useState("")
  const [regPass, setRegPass] = useState("")

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      // SECURE LOGIN: Uses Supabase Auth system [cite: 2026-02-10]
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      // Check if admin based on your existing logic (usually via a profile check)
      // Since we are using Supabase Auth, we fetch the member status from your table
      const { data: member } = await supabase
        .from('members')
        .select('is_admin, status')
        .eq('email', email)
        .single()

      if (member?.status !== 'Approved' && !member?.is_admin) {
        await supabase.auth.signOut()
        throw new Error("Your account is pending approval.")
      }

      toast({ title: "Welcome back!", description: "Login successful." })
      setLocation(member?.is_admin ? "/admin" : "/dashboard")
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: error.message || "Invalid credentials.",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async () => {
    if (!email) {
      return toast({ variant: "destructive", title: "Email Required", description: "Please enter your email to receive a reset link." })
    }
    setResetLoading(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      if (error) throw error
      toast({ title: "Link Sent", description: "Check your inbox for the password reset link." })
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message })
    } finally {
      setResetLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const success = await register({
        full_name: regName,
        email: regEmail,
        password: regPass,
        status: "pending",
      })

      if (success) {
        toast({
          title: "Application Submitted!",
          description: "Please wait for admin approval before logging in.",
          className: "bg-emerald-50 border-emerald-200",
        })
        setRegName("")
        setRegEmail("")
        setRegPass("")
      } else {
        toast({ variant: "destructive", title: "Error", description: "Registration failed." })
      }
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "Connection error." })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2 overflow-hidden">
      {/* Left Column: Hero & Navigation */}
      <div className="relative hidden lg:flex flex-col p-12 text-white bg-[#1a4d3c]">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-40 mix-blend-overlay"
          style={{ backgroundImage: `url(${heroBg})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a4d3c]/90 to-[#1a4d3c]/60" />

        <div className="relative z-10 flex items-center gap-6">
          <div className="relative h-20 w-20 flex items-center justify-center bg-white rounded-full shadow-2xl shrink-0 overflow-hidden border-4 border-white/20">
            <img src={logoUpdate} alt="Swapnodinga Logo" className="w-full h-full object-contain scale-150 -translate-y-1" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-3xl font-serif font-bold tracking-tight drop-shadow-lg">Swapnodinga</h1>
            <p className="text-[10px] uppercase tracking-[0.3em] text-emerald-300/80 font-medium">Cooperative Housing Society</p>
          </div>
        </div>

        <div className="relative z-10 flex-1 flex items-center">
          <nav className="flex items-center gap-8 py-4 px-10 bg-white/10 backdrop-blur-md rounded-full border border-white/20 shadow-2xl">
            <Link href="/about"><a className="flex items-center gap-2.5 text-sm font-medium group"><Info size={18} className="text-emerald-400" />About Us</a></Link>
            <Link href="/project"><a className="flex items-center gap-2.5 text-sm font-medium group"><Briefcase size={18} className="text-emerald-400" />Our Project</a></Link>
            <Link href="/policy"><a className="flex items-center gap-2.5 text-sm font-medium group"><ShieldAlert size={18} className="text-emerald-400" />Policy</a></Link>
            <Link href="/contact"><a className="flex items-center gap-2.5 text-sm font-medium group"><Phone size={18} className="text-emerald-400" />Contact</a></Link>
          </nav>
        </div>

        <div className="relative z-10 space-y-4 max-w-lg mb-4">
          <h2 className="text-5xl font-serif font-bold leading-tight">Building Our Dream Homes <span className="text-emerald-400">Together</span></h2>
          <p className="text-lg text-primary-foreground/80 font-light italic">"Sobar Jonno Somoyon, Swapnodinga-r Ayojon"</p>
          <div className="pt-8 text-xs text-white/40 tracking-wider">&copy; 2026 Swapnodinga Cooperative Society. All rights reserved.</div>
        </div>
      </div>

      {/* Right Column: Authentication */}
      <div className="flex items-center justify-center p-8 bg-slate-50">
        <div className="w-full max-w-md">
          <Card className="border-none shadow-2xl bg-white rounded-2xl overflow-hidden">
            <div className="h-2 bg-[#1a4d3c]" />
            <CardHeader className="text-center pt-8 pb-4">
              <CardTitle className="text-2xl font-bold text-slate-800">Member Access</CardTitle>
              <CardDescription className="text-slate-500">Manage your installments and savings</CardDescription>
            </CardHeader>
            <CardContent className="px-8 pb-10">
              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-8 bg-slate-100 rounded-xl p-1">
                  <TabsTrigger value="login" className="rounded-lg py-2.5">Login</TabsTrigger>
                  <TabsTrigger value="register" className="rounded-lg py-2.5">Join Society</TabsTrigger>
                </TabsList>

                <TabsContent value="login" className="space-y-4">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="email" className="text-slate-600 font-medium ml-1">Email Address</Label>
                      <Input id="email" type="email" className="rounded-xl h-12" placeholder="your@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <Label htmlFor="password" className="text-slate-600 font-medium ml-1">Password</Label>
                        <button type="button" onClick={handleForgotPassword} className="text-xs text-emerald-600 hover:underline">
                          {resetLoading ? "Sending..." : "Forgot Password?"}
                        </button>
                      </div>
                      <Input id="password" type="password" className="rounded-xl h-12" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
                    </div>
                    <Button type="submit" className="w-full h-12 bg-[#1a4d3c] hover:bg-[#133a2d] rounded-xl font-bold text-white shadow-lg mt-4" disabled={loading}>
                      {loading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : "Login to Portal"}
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="register" className="space-y-4">
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="name" className="text-slate-600 font-medium ml-1">Full Name</Label>
                      <Input id="name" className="rounded-xl h-12" placeholder="As per NID/Passport" value={regName} onChange={(e) => setRegName(e.target.value)} required />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="reg-email" className="text-slate-600 font-medium ml-1">Email</Label>
                      <Input id="reg-email" type="email" className="rounded-xl h-12" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} required />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="reg-pass" className="text-slate-600 font-medium ml-1">Create Password</Label>
                      <Input id="reg-pass" type="password" className="rounded-xl h-12" value={regPass} onChange={(e) => setRegPass(e.target.value)} required />
                    </div>
                    <Button type="submit" variant="secondary" className="w-full h-12 rounded-xl font-bold border-2 mt-4" disabled={loading}>
                      {loading ? "Processing..." : "Submit Membership Request"}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}