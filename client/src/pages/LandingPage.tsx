import { useState } from "react";
import { useSociety } from "@/context/SocietyContext";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Home, Key, UserPlus } from "lucide-react";
import logo from "@assets/generated_images/swapnodinga_logo.png";
import heroBg from "@assets/generated_images/housing_community_hero_background.png";

export default function LandingPage() {
  const { login, register } = useSociety();
  const [, setLocation] = useLocation();
  const [loading, setLoading] = useState(false);

  // Login State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Register State
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
      alert("Invalid credentials or account not active.");
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await register(regName, regEmail, regPass);
    setLoading(false);
    // Switch to login tab ideally, but simple alert handled in context
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left: Hero Section */}
      <div className="relative hidden lg:flex flex-col justify-between p-12 text-white bg-primary">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-40 mix-blend-overlay"
          style={{ backgroundImage: `url(${heroBg})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/90 to-primary/60" />
        
        <div className="relative z-10 flex items-center gap-3">
          <img src={logo} alt="Logo" className="w-12 h-12 bg-white rounded-full p-1" />
          <h1 className="text-2xl font-serif font-bold">Swapnodinga</h1>
        </div>

        <div className="relative z-10 space-y-6 max-w-lg">
          <h2 className="text-5xl font-serif font-bold leading-tight">
            Building Our Dream Homes <span className="text-accent">Together</span>
          </h2>
          <p className="text-lg text-primary-foreground/80 font-light">
            A cooperative society dedicated to securing a future for our families. 
            Join us in building a sustainable community.
          </p>
        </div>

        <div className="relative z-10 text-sm text-primary-foreground/60">
          &copy; 2024 Swapnodinga Cooperative Society. All rights reserved.
        </div>
      </div>

      {/* Right: Auth Forms */}
      <div className="flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:hidden mb-8">
             <img src={logo} alt="Logo" className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-full p-2" />
             <h1 className="text-3xl font-serif font-bold text-primary">Swapnodinga</h1>
          </div>

          <Card className="border-none shadow-xl bg-card/50 backdrop-blur-sm">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-2xl">Welcome Back</CardTitle>
              <CardDescription>Manage your savings and instalments</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="login">Login</TabsTrigger>
                  <TabsTrigger value="register">Register</TabsTrigger>
                </TabsList>
                
                <TabsContent value="login">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <div className="relative">
                        <Home className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input 
                          id="email" 
                          type="email" 
                          placeholder="member@example.com" 
                          className="pl-9"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <div className="relative">
                        <Key className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input 
                          id="password" 
                          type="password" 
                          placeholder="••••••••" 
                          className="pl-9"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    <Button type="submit" className="w-full font-semibold" disabled={loading}>
                      {loading ? "Logging in..." : "Access Dashboard"}
                    </Button>
                  </form>
                </TabsContent>
                
                <TabsContent value="register">
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <div className="relative">
                        <UserPlus className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input 
                          id="name" 
                          placeholder="John Doe" 
                          className="pl-9"
                          value={regName}
                          onChange={(e) => setRegName(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reg-email">Email Address</Label>
                      <Input 
                        id="reg-email" 
                        type="email" 
                        placeholder="john@example.com" 
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
                        placeholder="Create a strong password" 
                        value={regPass}
                        onChange={(e) => setRegPass(e.target.value)}
                        required
                      />
                    </div>
                    <Button type="submit" variant="secondary" className="w-full" disabled={loading}>
                      {loading ? "Processing..." : "Submit Application"}
                    </Button>
                    <p className="text-xs text-center text-muted-foreground mt-2">
                      Your account will require admin approval before you can log in.
                    </p>
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
