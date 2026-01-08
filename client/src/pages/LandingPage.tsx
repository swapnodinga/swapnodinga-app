import { useState } from "react";
import { useSociety } from "@/context/SocietyContext";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Home, Key, UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// ASSETS: Using your updated logo and hero background
import logoUpdate from "@assets/generated_images/SwapnoDinga_Logo_Update.png";
import heroBg from "@assets/generated_images/housing_community_hero_background.png";

export default function LandingPage() {
  const { login, register } = useSociety();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  // AUTH STATE: Logic remains untouched as per previous fixes [cite: 2026-01-05]
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPass, setRegPass] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const success = await login(email, password);
    setLoading(false);
    
    if (success) {
      if (email === "admin@swapnodinga.com") {
        setLocation("/admin");
      } else {
        setLocation("/dashboard");
      }
    } else {
      toast({ 
        variant: "destructive", 
        title: "Login Failed", 
        description: "Invalid credentials or account not active." 
      });
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Logic preserved to match Supabase 'full_name' column [cite: 2026-01-05]
      const success = await register({
        full_name: regName, 
        email: regEmail,
        password: regPass,
        status: 'pending' 
      });

      if (success) {
        toast({ 
          title: "Application Submitted!", 
          description: "Please wait for admin approval before logging in.",
          className: "bg-emerald-50 border-emerald-200"
        });
        setRegName(""); setRegEmail(""); setRegPass("");
      } else {
        toast({ variant: "destructive", title: "Error", description: "Registration failed." });
      }
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "Connection error." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left: Hero Section with Branding */}
      <div className="relative hidden lg:flex flex-col justify-between p-12 text-white bg-[#1a4d3c]">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-40 mix-blend-overlay"
          style={{ backgroundImage: `url(${heroBg})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a4d3c]/90 to-[#1a4d3c]/60" />
        
        {/* BRANDING: Enlarged Circle + Brand Name */}
        <div className="relative z-10 flex items-center gap-6">
          <div className="relative h-24 w-24 flex items-center justify-center bg-white rounded-full shadow-2xl shrink-0 overflow-hidden border-4 border-white/20">
            {/* scale-150: Enlarges the house icon and half-round text within the circle 
              -translate-y-1: Visually centers the graphic elements
            */}
            <img 
              src={logoUpdate} 
              alt="Swapnodinga Logo" 
              className="w-full h-full object-contain scale-150 -translate-y-1" 
            />
          </div>
          
          <div className="flex flex-col">
            <h1 className="text-4xl font-serif font-bold tracking-tight drop-shadow-lg">
              Swapnodinga
            </h1>
            <p className="text-xs uppercase tracking-[0.3em] text-emerald-300/80 font-medium">
              Cooperative Housing Society
            </p>
          </div>
        </div>

        <div className="relative z-10 space-y-6 max-w-lg">
          <h2 className="text-5xl font-serif font-bold leading-tight">
            Building Our Dream Homes <span className="text-emerald-400">Together</span>
          </h2>
          <p className="text-lg text-primary-foreground/80 font-light italic">
            "Sobar Jonno Somoyon, Swapnodinga-r Ayojon"
          </p>
        </div>

        <div className="relative z-10 text-sm text-primary-foreground/40">
          &copy; 2026 Swapnodinga Cooperative Society. All rights reserved.
        </div>
      </div>

      {/* Right: Authentication Forms (Functional Logic Preserved) [cite: 2026-01-05] */}
      <div className="flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-8">
          <Card className="border-none shadow-xl bg-card/50 backdrop-blur-sm">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-2xl">Member Access</CardTitle>
              <CardDescription>Securely manage your installments and savings</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="login">Login</TabsTrigger>
                  <TabsTrigger value="register">Join Society</TabsTrigger>
                </TabsList>
                
                <TabsContent value="login">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input 
                        id="email" 
                        type="email" 
                        placeholder="your@email.com" 
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)} 
                        required 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input 
                        id="password" 
                        type="password" 
                        placeholder="••••••••" 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)} 
                        required 
                      />
                    </div>
                    <Button type="submit" className="w-full bg-[#1a4d3c] hover:bg-[#133a2d] font-semibold" disabled={loading}>
                      {loading ? "Authenticating..." : "Login to Portal"}
                    </Button>
                  </form>
                </TabsContent>
                
                <TabsContent value="register">
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input 
                        id="name" 
                        placeholder="As per NID/Passport" 
                        value={regName} 
                        onChange={(e) => setRegName(e.target.value)} 
                        required 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reg-email">Email</Label>
                      <Input 
                        id="reg-email" 
                        type="email" 
                        value={regEmail} 
                        onChange={(e) => setRegEmail(e.target.value)} 
                        required 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reg-pass">Create Password</Label>
                      <Input 
                        id="reg-pass" 
                        type="password" 
                        value={regPass} 
                        onChange={(e) => setRegPass(e.target.value)} 
                        required 
                      />
                    </div>
                    <Button type="submit" variant="secondary" className="w-full font-semibold" disabled={loading}>
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
  );
}