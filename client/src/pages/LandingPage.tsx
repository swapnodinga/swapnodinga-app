"use client"

import type React from "react"
import { useState } from "react"
import { useSociety } from "@/context/SocietyContext"
import { Link, useLocation } from "wouter"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { Info, Briefcase, ShieldAlert, Phone } from "lucide-react"

import logoUpdate from "@assets/generated_images/SwapnoDinga_Logo_Update.png"
import heroBg from "@assets/generated_images/housing_community_hero_background.png"

export default function LandingPage() {
  const { login, register, currentUser } = useSociety()
  const [, setLocation] = useLocation()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [regName, setRegName] = useState("")
  const [regEmail, setRegEmail] = useState("")
  const [regPass, setRegPass] = useState("")

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const result = await login(email, password)
    setLoading(false)

    if (result) {
      if (currentUser?.is_admin) {
        setLocation("/admin")
      } else {
        setLocation("/dashboard")
      }
    } else {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: "Invalid credentials or account not active.",
      })
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
        })
        setRegName(""); setRegEmail(""); setRegPass("");
      } else {
        toast({ variant: "destructive", title: "Error", description: "Registration failed." })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2 overflow-hidden">
      <div className="relative hidden lg:flex flex-col p-12 text-white bg-[#1a4d3c]">
        <div className="absolute inset-0 bg-cover bg-center opacity-40 mix-blend-overlay" style={{ backgroundImage: `url(${heroBg})` }} />
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a4d3c]/90 to-[#1a4d3c]/60" />
        <div className="relative z-10 flex items-center gap-6">
          <div className="relative h-20 w-20 flex items-center justify-center bg-white rounded-full overflow-hidden border-4 border-white/20">
            <img src={logoUpdate} alt="Logo" className="w-full h-full object-contain scale-150" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-3xl font-serif font-bold tracking-tight">Swapnodinga</h1>
            <p className="text-[10px] uppercase tracking-[0.3em] text-emerald-300/80 font-medium">Cooperative Housing Society</p>
          </div>
        </div>
        <div className="relative z-10 flex-1 flex items-center">
          <nav className="flex items-center gap-8 py-4 px-10 bg-white/10 backdrop-blur-md rounded-full border border-white/20 shadow-2xl">
            <Link href="/about"><a className="text-sm font-medium hover:text-emerald-300">About Us</a></Link>
            <Link href="/project"><a className="text-sm font-medium hover:text-emerald-300">Our Project</a></Link>
            <Link href="/policy"><a className="text-sm font-medium hover:text-emerald-300">Policy</a></Link>
            <Link href="/contact"><a className="text-sm font-medium hover:text-emerald-300">Contact</a></Link>
          </nav>
        </div>
        <div className="relative z-10 space-y-4 max-w-lg mb-4">
          <h2 className="text-5xl font-serif font-bold leading-tight">Building Our Dream Homes <span className="text-emerald-400">Together</span></h2>
          <p className="text-lg text-primary-foreground/80 font-light italic">"Sobar Jonno Somoyon, Swapnodinga-r Ayojon"</p>
        </div>
      </div>

      <div className="flex items-center justify-center p-8 bg-slate-50">
        <div className="w-full max-w-md">
          <Card className="border-none shadow-2xl bg-white rounded-2xl overflow-hidden">
            <div className="h-2 bg-[#1a4d3c]" />
            <CardHeader className="text-center pt-8 pb-4">
              <CardTitle className="text-2xl font-bold text-slate-800">Member Access</CardTitle>
              <CardDescription>Manage your installments and savings</CardDescription>
            </CardHeader>
            <CardContent className="px-8 pb-10">
              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-8 bg-slate-100 rounded-xl p-1">
                  <TabsTrigger value="login">Login</TabsTrigger>
                  <TabsTrigger value="register">Join Society</TabsTrigger>
                </TabsList>
                <TabsContent value="login" className="space-y-4">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="email">Email Address</Label>
                      <Input id="email" type="email" placeholder="your@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <Label htmlFor="password">Password</Label>
                        <Link href="/reset-password"><a className="text-xs text-emerald-600 hover:underline">Forgot Password?</a></Link>
                      </div>
                      <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
                    </div>
                    <Button type="submit" className="w-full h-12 bg-[#1a4d3c] hover:bg-[#133a2d] rounded-xl font-bold text-white shadow-lg" disabled={loading}>
                      {loading ? "Authenticating..." : "Login to Portal"}
                    </Button>
                  </form>
                </TabsContent>
                <TabsContent value="register" className="space-y-4">
                  <form onSubmit={handleRegister} className="space-y-4">
                    <Input placeholder="Full Name" value={regName} onChange={(e) => setRegName(e.target.value)} required />
                    <Input type="email" placeholder="Email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} required />
                    <Input type="password" placeholder="Create Password" value={regPass} onChange={(e) => setRegPass(e.target.value)} required />
                    <Button type="submit" variant="secondary" className="w-full h-12 rounded-xl font-bold" disabled={loading}>
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