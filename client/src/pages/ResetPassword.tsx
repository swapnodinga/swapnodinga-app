"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useLocation } from "wouter";
import { useSociety } from "@/context/SocietyContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Lock, Loader2, ArrowLeft } from "lucide-react";

export default function ResetPassword() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { currentUser, logout, isLoading } = useSociety();

  useEffect(() => {
    // Check if the URL contains a recovery hash from the email link
    const isRecovery = window.location.hash.includes('type=recovery') || 
                       window.location.search.includes('type=recovery');

    // If not loading, user is NOT logged in, AND it's not a recovery link, redirect to login
    if (!isLoading && !currentUser && !isRecovery) {
      toast({ 
        variant: "destructive", 
        title: "Access Denied", 
        description: "Please log in or use a valid reset link from your email." 
      });
      setLocation("/");
    }
  }, [currentUser, isLoading, setLocation, toast]);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword.length < 6) {
      return toast({ 
        variant: "destructive", 
        title: "Weak Password", 
        description: "Password must be at least 6 characters." 
      });
    }

    if (newPassword !== confirmPassword) {
      return toast({ 
        variant: "destructive", 
        title: "Mismatch", 
        description: "Passwords do not match." 
      });
    }

    try {
      setLoading(true);

      // 1. Update the password in Supabase Auth (handles the recovery session automatically)
      const { data: authData, error: authError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (authError) throw authError;

      // 2. Identify the correct UUID to avoid "integer = uuid" errors
      const userId = authData.user?.id || currentUser?.id;

      if (!userId) {
        throw new Error("User identity not found. Please try the link again.");
      }

      // 3. Sync the new password to your custom members table (Hashed)
      const { error: rpcError } = await supabase.rpc('update_member_password', { 
        member_id: userId, 
        new_pass: newPassword 
      });

      if (rpcError) throw rpcError;

      toast({ 
        title: "Success", 
        description: "Your password has been updated. Please log in again." 
      });
      
      // 4. Force logout to clear temporary recovery sessions and redirect
      await logout();
      setLocation("/");
    } catch (error: any) {
      console.error("Reset Error:", error);
      toast({ 
        variant: "destructive", 
        title: "Update Failed", 
        description: error.message || "Database sync failed." 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <Card className="w-full max-w-md shadow-xl border-emerald-100">
        <div className="h-2 bg-[#1a4d3c] rounded-t-xl" />
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
            <Lock className="text-emerald-700" size={24} />
          </div>
          <CardTitle className="text-2xl font-bold text-slate-900 font-serif">
            Set New Password
          </CardTitle>
          <CardDescription>
            Enter your new secure password below to regain access.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <Input 
                id="password" 
                type="password" 
                placeholder="••••••••"
                value={newPassword} 
                onChange={(e) => setNewPassword(e.target.value)} 
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm">Confirm Password</Label>
              <Input 
                id="confirm" 
                type="password" 
                placeholder="••••••••"
                value={confirmPassword} 
                onChange={(e) => setConfirmPassword(e.target.value)} 
                required 
              />
            </div>
            <Button 
              type="submit" 
              className="w-full bg-emerald-800 hover:bg-emerald-900 transition-colors" 
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin mr-2" size={18} />
                  Updating...
                </>
              ) : (
                "Update Password"
              )}
            </Button>
            
            <Button 
              type="button" 
              variant="ghost" 
              className="w-full text-slate-500" 
              onClick={() => setLocation("/")}
            >
              <ArrowLeft size={14} className="mr-2" /> Back to Login
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}