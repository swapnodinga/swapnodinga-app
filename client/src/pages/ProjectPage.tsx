"use client"

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Building2, MapPin, CheckCircle2, Clock, Construction, Phone,
  Layers, Maximize2, BadgePercent, CircleDollarSign, ArrowRight, Loader2, Home
} from "lucide-react";

export default function ProjectPage() {
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({});

  useEffect(() => {
    async function fetchData() {
      // Fetch Site Settings (for Address and WhatsApp)
      const { data: sData } = await supabase.from('site_settings').select('*');
      if (sData) {
        const settingsMap = sData.reduce((acc: any, item: any) => {
          acc[item.setting_key] = item.setting_value;
          return acc;
        }, {});
        setSettings(settingsMap);
      }

      // Fetch Projects
      const { data: pData } = await supabase.from('projects').select('*').order('created_at', { ascending: false });
      if (pData) setProjects(pData);
      
      setLoading(false);
    }
    fetchData();
  }, []);

  const ongoing = projects.filter(p => p.project_type === 'ongoing');
  const finished = projects.filter(p => p.project_type === 'finished');
  const dynamicRoadmap = projects.filter(p => p.project_type === 'roadmap');

  // Static Historical Milestones (Your earlier data)
  const staticRoadmap = [
    {
      id: 'static-1',
      title: "Society Foundation",
      description: "Official registration and core committee formation completed in late 2024.",
      isStatic: true
    },
    {
      id: 'static-2',
      title: "First Capital Collection",
      description: "Successfully reached the initial subscription goal from our founding members.",
      isStatic: true
    },
    {
      id: 'static-3',
      title: "Land Identification",
      description: "Primary site identification and feasibility study completed for our first project.",
      isStatic: true
    }
  ];

  // Merge Static History with Admin-added Roadmap items
  const fullRoadmap = [...staticRoadmap, ...dynamicRoadmap];

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-emerald-600 h-10 w-10" /></div>;

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-20 animate-in fade-in duration-700 pb-24">
      
      {/* NEW: OFFICE ADDRESS SECTION */}
      <section className="bg-emerald-900 text-white p-8 md:p-12 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-10 opacity-10">
          <Building2 size={200} />
        </div>
        <div className="relative z-10 grid md:grid-cols-2 gap-8 items-center">
          <div className="space-y-6">
            <div className="inline-block bg-emerald-500/20 px-4 py-1 rounded-full border border-emerald-500/30 text-emerald-300 text-xs font-bold uppercase tracking-widest">
              Contact Information
            </div>
            <h2 className="text-4xl font-serif font-bold">Visit Our Registered Office</h2>
            <div className="space-y-4">
              <div className="flex gap-4 items-start">
                <MapPin className="text-emerald-400 shrink-0 mt-1" size={24} />
                <p className="text-xl text-emerald-50 leading-relaxed font-light">
                  {settings.office_address || "Office Address not configured in Admin Settings."}
                </p>
              </div>
              <div className="flex gap-4 items-center">
                <Phone className="text-emerald-400 shrink-0" size={20} />
                <p className="text-lg font-medium">{settings.contact_phone || "Phone not available"}</p>
              </div>
            </div>
          </div>
          <div className="hidden md:flex justify-center">
            <div className="bg-white/10 backdrop-blur-md p-6 rounded-3xl border border-white/20">
               <Home size={80} className="text-emerald-300" />
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 1: ONGOING PROJECTS */}
      <section className="space-y-10">
        <div className="border-l-4 border-emerald-600 pl-4">
          <h2 className="text-4xl font-serif font-bold text-emerald-900">Ongoing Projects</h2>
          <p className="text-slate-600 text-lg">Active developments open for investment and booking.</p>
        </div>

        <div className="grid grid-cols-1 gap-12">
          {ongoing.map((project) => (
            <Card key={project.id} className="overflow-hidden border-emerald-100 shadow-xl group">
              <div className="grid grid-cols-1 lg:grid-cols-2">
                <div className="relative h-[300px] lg:h-full overflow-hidden bg-slate-100">
                  <img src={project.image_url || "/placeholder.jpg"} alt={project.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  <div className="absolute top-6 left-6 bg-emerald-600 text-white px-5 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest shadow-2xl animate-pulse">Investment Open</div>
                </div>
                <CardContent className="p-10 space-y-8 bg-white">
                  <div>
                    <h3 className="text-3xl font-bold text-slate-900 mb-2">{project.title}</h3>
                    <p className="flex items-center gap-2 text-emerald-700 font-semibold uppercase text-sm tracking-wide"><MapPin size={18} /> {project.location}</p>
                  </div>
                  <p className="text-slate-600 leading-relaxed text-lg italic border-l-4 border-slate-50 pl-6">{project.description}</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6 py-6 border-y border-slate-100">
                    <Spec icon={<CircleDollarSign/>} label="Per Share" value={`৳${Number(project.share_amount).toLocaleString()}`} />
                    <Spec icon={<BadgePercent/>} label="Discount" value={`৳${Number(project.at_once_discount).toLocaleString()}`} />
                    <Spec icon={<Layers/>} label="Floors" value={`${project.floors} Stories`} />
                    <Spec icon={<Maximize2/>} label="Size" value={project.flat_size} />
                  </div>
                  
                  {/* WhatsApp Integrated Button */}
                  <button 
                    onClick={() => {
                      const msg = encodeURIComponent(`Assalamu Alaikum. I am interested in the project: ${project.title}. Please provide more details.`);
                      window.open(`https://wa.me/${settings.whatsapp_number}?text=${msg}`, '_blank');
                    }}
                    className="w-full md:w-auto bg-emerald-900 text-white px-10 py-4 rounded-xl font-bold hover:bg-emerald-800 transition-all flex items-center justify-center gap-3 shadow-lg hover:-translate-y-1"
                  >
                    Book Your Interest <ArrowRight size={20} />
                  </button>
                </CardContent>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* SECTION 2: FINISHED PROJECTS */}
      <section className="space-y-12 bg-emerald-50/50 -mx-6 px-6 py-20 rounded-[3rem]">
        <div className="max-w-7xl mx-auto space-y-10">
          <div className="text-center space-y-3">
            <h2 className="text-4xl font-serif font-bold text-emerald-900">Completed Ventures</h2>
            <p className="text-slate-600 max-w-2xl mx-auto">Building a legacy of trust and quality through successfully delivered housing solutions.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {finished.map((project) => (
              <Card key={project.id} className="border-none shadow-lg hover:shadow-2xl transition-all rounded-2xl overflow-hidden">
                <div className="h-56 overflow-hidden"><img src={project.image_url} alt={project.title} className="w-full h-full object-cover" /></div>
                <CardContent className="p-8 space-y-4">
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-xl text-slate-900">{project.title}</h3>
                    <CheckCircle2 className="text-emerald-500 shrink-0" size={24} />
                  </div>
                  <p className="text-slate-600 text-sm leading-relaxed">{project.description}</p>
                  <div className="pt-4 border-t text-[10px] font-bold text-emerald-700 uppercase tracking-tighter">
                    Handover Date: {project.completion_date ? new Date(project.completion_date).toLocaleDateString() : 'N/A'}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 3: ROADMAP (Merged Static & Dynamic) */}
      <section className="space-y-16">
        <div className="text-center space-y-3">
          <h2 className="text-4xl font-serif font-bold text-emerald-900 flex items-center justify-center gap-4"><Construction className="text-emerald-600" size={36} /> Strategic Roadmap</h2>
          <p className="text-slate-600">Our journey from foundation to future community growth.</p>
        </div>
        <div className="relative max-w-5xl mx-auto px-4">
          <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-emerald-100 via-emerald-400 to-emerald-100 -translate-x-1/2 hidden md:block"></div>
          <div className="space-y-20">
            {fullRoadmap.map((item, idx) => (
              <div key={item.id} className={`relative flex items-center justify-between md:justify-normal group ${idx % 2 === 0 ? 'md:flex-row-reverse' : ''}`}>
                {/* Timeline Node */}
                <div className={`hidden md:flex items-center justify-center w-12 h-12 rounded-full border-4 border-white shadow-2xl shrink-0 absolute left-1/2 -translate-x-1/2 z-10 transition-transform group-hover:scale-125 duration-500 ${item.isStatic ? 'bg-emerald-600' : 'bg-amber-500'}`}>
                  {item.isStatic ? <CheckCircle2 size={20} className="text-white" /> : <Clock size={20} className="text-white" />}
                </div>
                
                {/* Content Card */}
                <div className="w-full md:w-[42%] p-8 rounded-[2rem] border border-emerald-50 bg-white shadow-xl hover:shadow-2xl transition-all duration-500">
                  <div className="flex items-center gap-2 mb-2">
                    {item.isStatic && <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded">Completed</span>}
                    {!item.isStatic && <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest bg-amber-50 px-2 py-0.5 rounded">Future Goal</span>}
                  </div>
                  <h4 className="font-bold text-emerald-900 text-2xl mb-3">{item.title}</h4>
                  <p className="text-slate-600 leading-relaxed">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function Spec({ icon, label, value }: { icon: any, label: string, value: string }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 text-slate-400">{icon}<span className="text-[10px] font-bold uppercase tracking-widest">{label}</span></div>
      <p className="font-extrabold text-slate-800">{value}</p>
    </div>
  );
}