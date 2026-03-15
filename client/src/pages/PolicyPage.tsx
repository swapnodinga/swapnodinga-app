"use client"

import React, { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { 
  Scale, FileText, Download, ExternalLink, 
  ShieldCheck, Info, Gavel, Users, 
  TrendingUp, Lock, Upload, Loader2 
} from "lucide-react";
import { useSociety } from "@/context/SocietyContext";

export default function PolicyPage() {
  const { currentUser } = useSociety();
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  
  // Use a state for the URL to trigger a re-render after upload
  const [policyUrl, setPolicyUrl] = useState("https://ivhjokefdwospalrqcmk.supabase.co/storage/v1/object/public/documents/society_policy.pdf");

  const isAdmin = currentUser?.email === 'swapnodinga.scs@gmail.com';

  const handleDownload = () => {
    // timestamp prevents browser from showing old cached versions
    window.open(`${policyUrl}?t=${new Date().getTime()}`, "_blank");
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      const file = e.target.files?.[0];
      if (!file) return;

      // Ensure it's a PDF
      if (file.type !== "application/pdf") {
        toast({ variant: "destructive", title: "Invalid File", description: "Please upload a PDF document." });
        return;
      }

      // Upload to Supabase Storage (upsert: true replaces the existing file)
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload('society_policy.pdf', file, {
          upsert: true,
          cacheControl: '0' // Prevents caching issues
        });

      if (uploadError) throw uploadError;

      toast({ title: "Policy Updated Successfully", description: "The new constitution is now live." });
      
      // Update local state to refresh the "Download" link target
      setPolicyUrl(`${policyUrl.split('?')[0]}?t=${new Date().getTime()}`);
      
    } catch (error: any) {
      toast({ variant: "destructive", title: "Upload Failed", description: error.message });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      
      {/* Header Section */}
      <div className="relative text-center space-y-4 py-8">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(45%_45%_at_50%_50%,rgba(16,185,129,0.12)_0%,rgba(255,255,255,0)_100%)]" />
        <div className="inline-flex p-4 bg-emerald-50 rounded-2xl text-emerald-700 mb-2 shadow-sm border border-emerald-100">
          <Scale size={32} />
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight font-serif">
          Society <span className="text-emerald-700">Constitution</span>
        </h1>
        <p className="text-slate-500 max-w-2xl mx-auto text-lg italic">
          "Ensuring transparency and collective growth for every member."
        </p>
      </div>

      {/* Main Feature Card */}
      <Card className="border-none bg-white shadow-[0_20px_50px_rgba(0,0,0,0.06)] overflow-hidden rounded-[2.5rem]">
        <div className="grid md:grid-cols-5 items-stretch">
          
          {/* Left Side: Visual/Context (Dark Emerald) */}
          <div className="md:col-span-2 bg-emerald-950 p-10 flex flex-col justify-between text-white relative overflow-hidden">
             <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-emerald-800 rounded-full opacity-10" />
             <div className="relative z-10 space-y-6">
                <div className="h-12 w-12 bg-emerald-500/20 rounded-xl flex items-center justify-center border border-emerald-500/30">
                  <Gavel size={24} className="text-emerald-400" />
                </div>
                <h3 className="text-2xl font-bold leading-tight">Legally Binding Framework</h3>
                <p className="text-emerald-100/60 text-sm leading-relaxed">
                  Our constitution is approved by the founding board to protect member investments and ensure fair profit distribution.
                </p>
             </div>
             <div className="relative z-10 pt-8 border-t border-emerald-900 mt-8">
                <div className="flex items-center gap-3 text-xs text-emerald-400 font-mono tracking-widest uppercase">
                  <Lock size={14} />
                  <span>Secure Document Access</span>
                </div>
             </div>
          </div>

          {/* Right Side: Actions (White/Green Theme) */}
          <div className="md:col-span-3 p-10 md:p-14 bg-white flex flex-col items-center justify-center text-center space-y-8">
            <div className="space-y-3">
              <div className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.3em]">Latest Revision</div>
              <h2 className="text-3xl font-bold text-slate-800">Official Policy File</h2>
              <div className="flex items-center justify-center gap-2 text-slate-400 text-sm">
                <FileText size={16} />
                <span>PDF Format • 170 KB • English/Bengali</span>
              </div>
            </div>

            <button 
              onClick={handleDownload}
              className="w-full max-w-xs flex items-center justify-center gap-3 bg-emerald-700 text-white px-8 py-5 rounded-2xl font-bold hover:bg-emerald-800 transition-all shadow-xl shadow-emerald-700/20 hover:shadow-emerald-700/40 active:scale-95 group"
            >
              <Download size={22} className="group-hover:translate-y-1 transition-transform" /> 
              Download Policy
            </button>

            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-[0.15em]">
              Last Verified: {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
        </div>

        {/* Updated Admin Management Section with Direct Upload */}
        {isAdmin && (
          <div className="bg-emerald-50/40 border-t border-emerald-100 px-10 py-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 shadow-inner">
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <span className="text-xs font-black text-emerald-900 tracking-widest uppercase block">Admin Control</span>
                  <span className="text-[10px] text-emerald-600 font-bold">Replace live policy document</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <input 
                  type="file" 
                  accept=".pdf" 
                  id="policy-upload" 
                  className="hidden" 
                  onChange={handleUpload}
                  disabled={uploading}
                />
                <label 
                  htmlFor="policy-upload"
                  className="flex items-center gap-2 cursor-pointer bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md hover:bg-emerald-800 transition-all disabled:opacity-50"
                >
                  {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                  {uploading ? "Updating..." : "Upload New PDF"}
                </label>
                
                <a 
                  href="https://supabase.com/dashboard/project/_/storage/buckets/documents" 
                  target="_blank" 
                  rel="noreferrer"
                  className="flex items-center gap-2 text-emerald-700 hover:text-emerald-900 font-bold text-sm bg-white border border-emerald-200 px-5 py-2.5 rounded-xl shadow-sm transition-all hover:border-emerald-300"
                >
                  Supabase <ExternalLink size={14} />
                </a>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Secondary Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { icon: Users, title: "Membership", desc: "Governance rules for onboarding and member conduct." },
          { icon: TrendingUp, title: "Investment", desc: "Guidelines on fund allocation and annual profit shares." },
          { icon: Lock, title: "Privacy", desc: "Data protection and financial record confidentiality." }
        ].map((item, i) => (
          <div key={i} className="group p-8 bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:border-emerald-200 transition-all">
            <div className={`h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-6 group-hover:bg-emerald-600 group-hover:text-white transition-all`}>
              <item.icon size={24} />
            </div>
            <h4 className="font-bold text-slate-800 text-lg mb-2">{item.title}</h4>
            <p className="text-slate-500 text-sm leading-relaxed">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}