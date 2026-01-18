"use client"

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { 
  Loader2, Milestone, CheckCircle2, Globe,
  MessageCircle, Facebook, Sparkles, Eye, Target, 
  ShieldCheck, TrendingUp, HeartHandshake 
} from "lucide-react";

export default function AboutPage() {
  const [committee, setCommittee] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch committee and join with members table
        const { data: cData, error: cError } = await supabase
          .from('committee')
          .select(`
            role,
            rank,
            members!member_id (
              full_name,
              profile_pic,
              society_id
            )
          `)
          .order('rank', { ascending: true });

        if (cError) throw cError;

        const { data: sData } = await supabase.from('site_settings').select('*');
        
        if (cData) {
          const dynamicCommittee = cData.map(item => ({
            role: item.role,
            // Access live data from the joined 'members' record
            name: item.members?.full_name || "Vacant Position",
            photo: item.members?.profile_pic || null,
            sid: item.members?.society_id || "N/A"
          }));
          setCommittee(dynamicCommittee);
        }

        if (sData) {
          const settingsMap = sData.reduce((acc: any, item: any) => {
            acc[item.setting_key] = item.setting_value;
            return acc;
          }, {});
          setSettings(settingsMap);
        }
      } catch (err) {
        console.error("Fetch Error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) return (
    <div className="h-screen flex items-center justify-center">
      <Loader2 className="animate-spin text-emerald-600 h-10 w-10" />
    </div>
  );

  return (
    <div className="animate-in fade-in duration-700">
      <section className="bg-gradient-to-b from-emerald-50 to-white py-24 px-6 text-center">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-100 text-emerald-800 rounded-full text-xs font-black tracking-widest uppercase">
            <Sparkles size={14} /> Shaping Tomorrow
          </div>
          <h1 className="text-5xl md:text-7xl font-serif font-bold text-slate-900 leading-tight">
            Empowering Community <br /> 
            <span className="text-emerald-600 italic">Through Unity</span>
          </h1>
        </div>
      </section>

      <div className="max-w-6xl mx-auto p-6 space-y-32 pb-24">
        <section className="space-y-12">
          <div className="text-center space-y-2">
            <h2 className="text-4xl font-bold text-slate-900">Executive Board</h2>
            <p className="text-slate-500">The leaders steering our society toward its goals.</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {committee.map((member, index) => (
              <div key={index} className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm text-center space-y-5 hover:shadow-xl transition-all group">
                <div className="h-28 w-28 rounded-2xl overflow-hidden bg-emerald-900 text-emerald-100 flex items-center justify-center font-bold text-2xl mx-auto group-hover:ring-4 ring-emerald-500/20 transition-all shadow-lg">
                  {member.photo ? (
                    <img src={member.photo} alt={member.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-emerald-900 uppercase">
                       {member.name?.split(' ').map((n:any) => n[0]).join('')}
                    </div>
                  )}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-xl">{member.name}</h4>
                  <p className="text-slate-400 text-[10px] font-mono mt-1 uppercase tracking-widest">{member.sid}</p>
                  <div className="inline-block mt-4 px-4 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-black uppercase tracking-widest">
                    {member.role}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}