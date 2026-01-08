import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { 
  Users, ShieldCheck, Target, Award, Globe, 
  BookOpen, Milestone, Loader2, CheckCircle2, 
  MessageCircle, Facebook, Youtube, TrendingUp, 
  HeartHandshake, Eye, Sparkles
} from "lucide-react";

export default function AboutPage() {
  const [committee, setCommittee] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      // Direct fetch from committee table with RLS disabled
      const { data: cData } = await supabase
        .from('committee')
        .select('*')
        .order('member_id', { ascending: true });

      const { data: sData } = await supabase.from('site_settings').select('*');
      
      if (cData) setCommittee(cData);
      if (sData) {
        const settingsMap = sData.reduce((acc: any, item: any) => {
          acc[item.setting_key] = item.setting_value;
          return acc;
        }, {});
        setSettings(settingsMap);
      }
      setLoading(false);
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
      
      {/* 1. Hero Section */}
      <section className="bg-gradient-to-b from-emerald-50 to-white py-24 px-6 text-center">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-100 text-emerald-800 rounded-full text-xs font-black tracking-widest uppercase">
            <Sparkles size={14} /> Shaping Tomorrow
          </div>
          <h1 className="text-5xl md:text-7xl font-serif font-bold text-slate-900 leading-tight">
            Empowering Community <br /> 
            <span className="text-emerald-600 italic">Through Unity</span>
          </h1>
          <p className="text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed">
            Swapnodinga is a premier digital cooperative society dedicated to 
            financial transparency, ethical savings, and collective prosperity.
          </p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto p-6 space-y-32 pb-24">
        
        {/* 2. Impact Statistics */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-8 py-12 border-y border-slate-100">
          {[
            { label: "Founded", value: "2024" },
            { label: "Transparency", value: "100%" },
            { label: "Support", value: "24/7" },
            { label: "Community", value: "Strong" }
          ].map((stat, i) => (
            <div key={i} className="text-center space-y-1">
              <div className="text-3xl md:text-4xl font-bold text-emerald-700">{stat.value}</div>
              <div className="text-xs font-black uppercase tracking-tighter text-slate-400">{stat.label}</div>
            </div>
          ))}
        </section>

        {/* 3. Vision & Mission Cards */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="space-y-6 p-10 rounded-[3rem] bg-emerald-900 text-white shadow-2xl">
            <div className="h-14 w-14 bg-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-400">
              <Eye size={32} />
            </div>
            <h3 className="text-3xl font-bold">Our Vision</h3>
            <p className="text-emerald-100/70 leading-relaxed text-sm">
              To become the most trusted digital financial community in Bangladesh, 
              where technology meets tradition to create a barrier-free environment 
              for personal and collective economic growth.
            </p>
          </div>
          <div className="space-y-6 p-10 rounded-[3rem] bg-white border border-slate-100 shadow-xl">
            <div className="h-14 w-14 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600">
              <Target size={32} />
            </div>
            <h3 className="text-3xl font-bold text-slate-900">Our Mission</h3>
            <p className="text-slate-500 leading-relaxed text-sm">
              Our mission is to provide a secure, interest-free digital platform that 
              enables members to save systematically, track funds transparently, and 
              receive community support during times of need.
            </p>
          </div>
        </section>

        {/* 4. Core Values Section */}
        <section className="space-y-16">
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-bold text-slate-900">What We Stand For</h2>
            <p className="text-slate-500 max-w-xl mx-auto">Our values are the compass that guides every decision we make as a society.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {[
              { icon: <ShieldCheck />, title: "Absolute Security", desc: "Every taka is protected by modern digital safeguards and complete audit trails." },
              { icon: <TrendingUp />, title: "Member Growth", desc: "We focus on increasing the value of our collective funds through ethical projects." },
              { icon: <HeartHandshake />, title: "Social Unity", desc: "We are more than a fund; we are a family that stands together in times of crisis." }
            ].map((v, i) => (
              <div key={i} className="group p-2">
                <div className="text-emerald-600 mb-4 group-hover:scale-110 transition-transform">{v.icon}</div>
                <h4 className="text-xl font-bold text-slate-900 mb-2">{v.title}</h4>
                <p className="text-slate-500 text-sm leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 5. Journey Timeline */}
        <section className="bg-slate-50 rounded-[4rem] p-12 md:p-20 space-y-16">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <h2 className="text-4xl font-bold text-slate-900">The Journey</h2>
            <div className="h-px flex-1 bg-slate-200 hidden md:block mx-8" />
            <div className="flex items-center gap-2 text-emerald-700 font-bold uppercase text-xs tracking-widest">
              <Milestone size={16} /> History of Excellence
            </div>
          </div>

          <div className="relative space-y-12 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-emerald-200">
            <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-emerald-600 text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                <CheckCircle2 size={18} />
              </div>
              <div className="w-[calc(100%-4rem)] md:w-[45%] p-8 rounded-[2rem] bg-white shadow-sm border border-emerald-50">
                <span className="font-black text-emerald-600 text-[10px] uppercase">February 2024</span>
                <h4 className="text-xl font-bold text-slate-900 mt-2 mb-2">The Genesis</h4>
                <p className="text-slate-500 text-sm leading-relaxed">Swapnodinga was founded by Md Golam Kibria with a core group of visionaries aiming to modernize community-led savings.</p>
              </div>
            </div>

            <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-900 text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                <Globe size={18} />
              </div>
              <div className="w-[calc(100%-4rem)] md:w-[45%] p-8 rounded-[2rem] bg-slate-900 text-white shadow-2xl">
                <span className="font-black text-emerald-400 text-[10px] uppercase">September 2024</span>
                <h4 className="text-xl font-bold mt-2 mb-2">Digital Transformation</h4>
                <p className="text-slate-300 text-sm leading-relaxed">Launched the automated Member Dashboard to provide real-time reporting and instant contribution tracking for all members.</p>
              </div>
            </div>
          </div>
        </section>

        {/* 6. Executive Leadership (Clean Grid) */}
        <section className="space-y-12">
          <div className="text-center space-y-2">
            <h2 className="text-4xl font-bold text-slate-900">Executive Board</h2>
            <p className="text-slate-500">The leaders steering our society toward its goals.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {committee.map((member) => (
              <div key={member.id} className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm text-center space-y-6 hover:shadow-xl transition-all group">
                <div className="h-24 w-24 rounded-2xl bg-emerald-900 text-emerald-100 flex items-center justify-center font-bold text-2xl mx-auto group-hover:bg-emerald-600 transition-colors shadow-lg">
                  {/* Clean initials logic */}
                  {member.name?.split(' ').map((n:any) => n[0]).join('')}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-xl">{member.name}</h4>
                  <p className="text-emerald-600 text-xs font-black uppercase tracking-widest mt-1">{member.role}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 7. Connect With Us */}
        <section className="text-center bg-[#064e3b] rounded-[3rem] p-10 md:p-14 text-white space-y-6">
          <div className="space-y-2">
            <h2 className="text-4xl font-bold">Join the Society</h2>
            <p className="text-emerald-100/70 text-sm max-w-md mx-auto leading-relaxed">
              We are always open to new members who share our vision of a transparent 
              financial community. Reach out to us today.
            </p>
          </div>
          
          <div className="flex flex-wrap justify-center gap-4 pt-4">
            {settings.whatsapp_number && (
              <a href={`https://wa.me/${settings.whatsapp_number}`} target="_blank" rel="noreferrer" className="flex items-center gap-3 bg-emerald-500 text-white px-8 py-3.5 rounded-full hover:bg-emerald-400 transition-all font-bold shadow-xl shadow-emerald-900/50">
                <MessageCircle size={20} /> WhatsApp Support
              </a>
            )}
            {settings.facebook_url && (
              <a href={settings.facebook_url} target="_blank" rel="noreferrer" className="flex items-center gap-3 bg-white/10 text-white border border-white/20 px-8 py-3.5 rounded-full hover:bg-white/20 transition-all font-bold">
                <Facebook size={20} /> Official Page
              </a>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}