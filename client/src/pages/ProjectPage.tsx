"use client"

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { 
  MapPin, CheckCircle2, Clock, Construction, 
  Layers, Maximize2, BadgePercent, CircleDollarSign, ArrowRight, Loader2, Home
} from "lucide-react";

export default function ProjectPage() {
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({});

  useEffect(() => {
    async function fetchData() {
      const { data: sData } = await supabase.from('site_settings').select('*');
      if (sData) {
        setSettings(sData.reduce((acc: any, item: any) => ({ ...acc, [item.setting_key]: item.setting_value }), {}));
      }
      const { data: pData } = await supabase.from('projects').select('*').order('created_at', { ascending: false });
      if (pData) setProjects(pData);
      setLoading(false);
    }
    fetchData();
  }, []);

  const ongoing = projects.filter(p => p.project_type === 'ongoing');
  const finished = projects.filter(p => p.project_type === 'finished');
  const dynamicRoadmap = projects.filter(p => p.project_type === 'roadmap');

  const staticRoadmap = [
    { id: 'h1', title: "Society Foundation", description: "Legal registration and initial member onboarding completed in Q4 2024.", type: 'static' },
    { id: 'h2', title: "Initial Capital Fund", description: "Successfully established the core investment reserve from our founding members.", type: 'static' }
  ];

  const fullRoadmap = [...staticRoadmap, ...dynamicRoadmap];

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-emerald-600 h-10 w-10" /></div>;

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-20 pb-24">
      {/* ADDRESS SECTION (BEFORE GOOGLE MAP AS REQUESTED) */}
      <section className="bg-emerald-900 text-white p-10 rounded-3xl shadow-2xl overflow-hidden relative">
        <div className="relative z-10 grid md:grid-cols-2 gap-8 items-center">
          <div className="space-y-4">
            <h2 className="text-3xl font-serif font-bold">Visit Our Office</h2>
            <div className="flex gap-4 items-start">
              <MapPin className="text-emerald-400 shrink-0" size={28} />
              <p className="text-lg text-emerald-50 leading-relaxed">{settings.office_address || "Address not set by admin."}</p>
            </div>
            <div className="flex gap-4 items-center">
              <Phone className="text-emerald-400 shrink-0" size={20} />
              <p className="font-bold">{settings.contact_phone}</p>
            </div>
          </div>
          <div className="h-48 bg-emerald-800/50 rounded-2xl flex items-center justify-center border border-emerald-700">
             <Home size={60} className="text-emerald-600 opacity-50" />
          </div>
        </div>
      </section>

      {/* ONGOING PROJECTS */}
      <section className="space-y-10">
        <h2 className="text-4xl font-serif font-bold text-emerald-900 border-l-4 border-emerald-600 pl-4">Ongoing Projects</h2>
        <div className="grid grid-cols-1 gap-12">
          {ongoing.map((project) => (
            <Card key={project.id} className="overflow-hidden border-emerald-100 shadow-xl group">
              <div className="grid lg:grid-cols-2">
                <div className="h-[300px] lg:h-full overflow-hidden bg-slate-100">
                  <img src={project.image_url || "/placeholder.jpg"} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                </div>
                <CardContent className="p-10 space-y-6">
                  <h3 className="text-3xl font-bold">{project.title}</h3>
                  <p className="text-slate-600 italic border-l-4 pl-4">{project.description}</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 border-y">
                    <Spec icon={<CircleDollarSign/>} label="Per Share" value={`৳${Number(project.share_amount).toLocaleString()}`} />
                    <Spec icon={<BadgePercent/>} label="Discount" value={`৳${Number(project.at_once_discount).toLocaleString()}`} />
                    <Spec icon={<Layers/>} label="Floors" value={`${project.floors}`} />
                    <Spec icon={<Maximize2/>} label="Size" value={project.flat_size} />
                  </div>
                  <Button 
                    onClick={() => {
                      const msg = encodeURIComponent(`I am interested in ${project.title}. Please provide more info.`);
                      window.open(`https://wa.me/${settings.whatsapp_number}?text=${msg}`, '_blank');
                    }}
                    className="w-full md:w-auto bg-emerald-900 hover:bg-emerald-800 text-lg h-14 px-10"
                  >
                    Book Your Interest <ArrowRight className="ml-2" />
                  </Button>
                </CardContent>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* ROADMAP SECTION */}
      <section className="space-y-16">
        <h2 className="text-4xl font-serif font-bold text-center flex items-center justify-center gap-4">
          <Construction className="text-emerald-600" /> Strategic Roadmap
        </h2>
        <div className="relative max-w-5xl mx-auto px-4">
          <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-emerald-100 -translate-x-1/2 hidden md:block" />
          <div className="space-y-16">
            {fullRoadmap.map((item, idx) => (
              <div key={item.id} className={`relative flex items-center justify-between md:justify-normal group ${idx % 2 === 0 ? 'md:flex-row-reverse' : ''}`}>
                <div className={`hidden md:flex items-center justify-center w-12 h-12 rounded-full shadow-2xl absolute left-1/2 -translate-x-1/2 z-10 ${item.type === 'static' ? 'bg-emerald-600' : 'bg-amber-500'}`}>
                   <CheckCircle2 size={20} className="text-white" />
                </div>
                <div className="w-full md:w-[42%] p-8 rounded-3xl border bg-white shadow-lg">
                  <h4 className="font-bold text-xl text-emerald-900">{item.title}</h4>
                  <p className="text-slate-600 mt-2">{item.description}</p>
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
      <div className="flex items-center gap-1 text-slate-400">{icon}<span className="text-[10px] font-bold uppercase">{label}</span></div>
      <p className="font-bold text-slate-800">{value}</p>
    </div>
  );
}