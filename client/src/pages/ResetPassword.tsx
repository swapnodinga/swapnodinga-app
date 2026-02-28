"use client"

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
    // Check if we are coming from an email recovery link
    const isRecovery = window.location.hash.includes('type=recovery') || 
                       window.location.search.includes('type=recovery');

    // If not loading, not logged in, AND not a recovery link, then redirect
    if (!isLoading && !currentUser && !isRecovery) {
      toast({ 
        variant: "destructive", 
        title: "Login Required", 
        description: "Please log in or use a valid reset link." 
      });
      setLocation("/");
    }
  }, [currentUser, isLoading, setLocation, toast]);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword.length < 6) {
      return toast({ variant: "destructive", title: "Weak Password", description: "Minimum 6 characters required." });
    }

    if (newPassword !== confirmPassword) {
      return toast({ variant: "destructive", title: "Mismatch", description: "Passwords do not match." });
    }

    try {
      setLoading(true);

      // 1. Update Supabase Auth (This handles the link session)
      const { data: authData, error: authError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (authError) throw authError;

      // 2. Update your custom members table using the secure RPC
      // If currentUser is null (from email link), we use the ID from authData
      const userId = currentUser?.id || authData.user?.id;

      if (!userId) throw new Error("Could not identify user session.");

      const { error: rpcError } = await supabase.rpc('update_member_password', { 
        member_id: userId, 
        new_pass: newPassword 
      });

      if (rpcError) throw rpcError;

      toast({ 
        title: "Success", 
        description: "Password updated successfully. Please log in with your new password." 
      });
      
      await logout(); // Clear any temporary recovery session
      setLocation("/");
    } catch (error: any) {
      console.error("Reset Error:", error);
      toast({ variant: "destructive", title: "Update Failed", description: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <Card className="w-full max-w-md shadow-xl border-emerald-100">
        <div className="h-2 bg-[#1a4d3c]" />
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
            <Lock className="text-emerald-700" size={24} />
          </div>
          <CardTitle className="text-2xl font-bold text-slate-900 font-serif">Set New Password</CardTitle>
          <CardDescription>Enter your new secure password below.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <Input id="password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm">Confirm Password</Label>
              <Input id="confirm" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full bg-emerald-800 hover:bg-emerald-900" disabled={loading}>
              {loading ? <Loader2 className="animate-spin mr-2" size={18} /> : "Update Password"}
            </Button>
            {!currentUser && (
               <Button type="button" variant="ghost" className="w-full" onClick={() => setLocation("/")}>
                <ArrowLeft size={14} className="mr-2" /> Back to Login
              </Button>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}