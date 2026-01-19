"use client"
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { 
  Loader2, Sparkles, Eye, Target, 
  ShieldCheck, TrendingUp, HeartHandshake,
  Users, Award, Building2, Landmark
} from "lucide-react";

export default function AboutPage() {
  const [committee, setCommittee] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const { data: cData, error: cError } = await supabase
          .from('committee')
          .select(`
            role, rank,
            members!member_id (full_name, profile_pic, society_id)
          `)
          .order('rank', { ascending: true });

        if (cError) throw cError;

        if (cData) {
          const dynamicCommittee = cData.map(item => ({
            role: item.role,
            name: item.members?.full_name || "Vacant Position",
            photo: item.members?.profile_pic || null,
            sid: item.members?.society_id || "N/A"
          }));
          setCommittee(dynamicCommittee);
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
    <div className="animate-in fade-in duration-1000 bg-white">
      {/* 1. HERO SECTION */}
      <section className="relative py-24 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-emerald-50 via-white to-transparent opacity-70" />
        <div className="max-w-4xl mx-auto text-center relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-100/50 text-emerald-800 rounded-full text-[10px] font-black tracking-[0.2em] uppercase border border-emerald-200">
            <Sparkles size={14} className="animate-pulse" /> Our Legacy
          </div>
          <h1 className="text-5xl md:text-7xl font-serif font-bold text-slate-900 leading-tight">
            Building a Legacy <br /> 
            <span className="text-emerald-600 italic">Of Shared Success</span>
          </h1>
          <p className="text-slate-500 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            Founded on the principles of trust and mutual growth, Swapnodinga is more than a society—it's a commitment to your financial future.
          </p>
        </div>
      </section>

      {/* 2. STATS SECTION (Professional Trust Builders) */}
      <div className="max-w-6xl mx-auto px-6 -mt-12 mb-32 relative z-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 bg-white p-8 rounded-[2rem] shadow-2xl shadow-emerald-900/5 border border-slate-100">
          {[
            { label: "Active Members", val: "500+", icon: Users },
            { label: "Total Projects", val: "12", icon: Building2 },
            { label: "Years of Trust", val: "05+", icon: Landmark },
            { label: "Growth Rate", val: "24%", icon: TrendingUp },
          ].map((stat, i) => (
            <div key={i} className="text-center space-y-1 border-r last:border-0 border-slate-100">
              <div className="flex justify-center mb-2"><stat.icon size={20} className="text-emerald-600" /></div>
              <h3 className="text-2xl md:text-3xl font-bold text-slate-900">{stat.val}</h3>
              <p className="text-slate-400 text-xs uppercase tracking-widest font-medium">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6 space-y-32 pb-32">
        {/* 3. VISION & MISSION (Professional Cards) */}
        <section className="grid md:grid-cols-2 gap-12">
          <div className="bg-slate-900 rounded-[3rem] p-12 text-white space-y-6 relative overflow-hidden group hover:-translate-y-2 transition-transform">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
              <Eye size={120} />
            </div>
            <div className="h-12 w-12 bg-emerald-500 rounded-2xl flex items-center justify-center">
              <Eye size={24} className="text-white" />
            </div>
            <h3 className="text-3xl font-bold">Our Vision</h3>
            <p className="text-slate-400 leading-relaxed text-lg">
              To be the premier cooperative society known for transparent management, sustainable community development, and empowering every member to achieve their life-long dreams through collective strength.
            </p>
          </div>

          <div className="bg-emerald-600 rounded-[3rem] p-12 text-white space-y-6 relative overflow-hidden group hover:-translate-y-2 transition-transform">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
              <Target size={120} />
            </div>
            <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center">
              <Target size={24} className="text-emerald-600" />
            </div>
            <h3 className="text-3xl font-bold">Our Mission</h3>
            <p className="text-emerald-100 leading-relaxed text-lg">
              We strive to provide secure financial solutions, foster a culture of savings, and execute high-value projects that generate consistent returns for our members while maintaining the highest ethical standards.
            </p>
          </div>
        </section>

        {/* 4. CORE VALUES (Professional Grid) */}
        <section className="space-y-16">
          <div className="text-center max-w-2xl mx-auto space-y-4">
            <h2 className="text-4xl font-bold text-slate-900">Our Core Values</h2>
            <div className="h-1 w-20 bg-emerald-600 mx-auto rounded-full" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              { title: "Integrity First", desc: "We maintain absolute transparency in every transaction and decision.", icon: ShieldCheck },
              { title: "Mutual Respect", desc: "Every member's voice is valued in our democratic cooperative structure.", icon: HeartHandshake },
              { title: "Excellence", desc: "We strive for professional perfection in all our society projects.", icon: Award },
            ].map((value, i) => (
              <div key={i} className="text-center space-y-4">
                <div className="h-16 w-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto text-emerald-600 border border-emerald-100">
                  <value.icon size={32} />
                </div>
                <h4 className="text-xl font-bold text-slate-900">{value.title}</h4>
                <p className="text-slate-500 leading-relaxed">{value.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 5. EXECUTIVE BOARD (Updated Styling) */}
        <section className="space-y-16">
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-bold text-slate-900 uppercase tracking-tight">The Executive Board</h2>
            <p className="text-slate-500 max-w-xl mx-auto">Our leadership team brings decades of combined experience in community management and financial planning.</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {committee.map((member, index) => (
              <div key={index} className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)] text-center space-y-6 hover:border-emerald-200 transition-all group relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-bl-[4rem] -mr-12 -mt-12 group-hover:bg-emerald-100 transition-colors" />
                
                <div className="h-32 w-32 rounded-3xl overflow-hidden bg-emerald-900 text-emerald-100 flex items-center justify-center font-bold text-2xl mx-auto group-hover:rotate-3 transition-all shadow-xl border-4 border-white">
                  {member.photo ? (
                    <img src={member.photo} alt={member.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-emerald-900 uppercase">
                       {member.name?.split(' ').map((n:any) => n[0]).slice(0, 2).join('')}
                    </div>
                  )}
                </div>
                <div className="relative z-10">
                  <h4 className="font-bold text-slate-900 text-xl group-hover:text-emerald-700 transition-colors">{member.name}</h4>
                  <p className="text-slate-400 text-[10px] font-mono mt-2 uppercase tracking-[0.3em] font-bold">{member.sid}</p>
                  <div className="inline-block mt-5 px-6 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-[11px] font-black uppercase tracking-widest border border-emerald-100 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                    {member.role}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* 6. CALL TO ACTION */}
      <section className="bg-slate-50 py-24 px-6">
        <div className="max-w-4xl mx-auto text-center space-y-8 bg-white p-12 rounded-[4rem] border border-slate-100 shadow-sm">
          <h2 className="text-3xl md:text-5xl font-serif font-bold text-slate-900">Ready to Join Our Community?</h2>
          <p className="text-slate-500 text-lg">Experience the power of cooperative living and secure your financial future today.</p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
             <button className="px-8 py-4 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20">
               Become a Member
             </button>
             <button className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all">
               Contact Support
             </button>
          </div>
        </div>
      </section>
    </div>
  );
}