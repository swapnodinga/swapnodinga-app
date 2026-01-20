"use client"

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Building2, 
  MapPin, 
  CheckCircle2, 
  Clock, 
  Construction,
  Layers,
  Maximize2,
  BadgePercent,
  CircleDollarSign,
  ArrowRight,
  Loader2
} from "lucide-react";

export default function ProjectPage() {
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<any[]>([]);

  useEffect(() => {
    async function fetchProjects() {
      const { data } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (data) setProjects(data);
      setLoading(false);
    }
    fetchProjects();
  }, []);

  const ongoing = projects.filter(p => p.project_type === 'ongoing');
  const finished = projects.filter(p => p.project_type === 'finished');
  const roadmap = projects.filter(p => p.project_type === 'roadmap');

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="animate-spin text-emerald-600 h-10 w-10" />
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-20 animate-in fade-in duration-700 pb-20">
      
      {/* 1. ONGOING PROJECTS SECTION */}
      <section className="space-y-8">
        <div className="border-l-4 border-emerald-600 pl-4">
          <h2 className="text-3xl font-serif font-bold text-emerald-900">Ongoing Projects</h2>
          <p className="text-slate-600">Explore our current developments and investment opportunities.</p>
        </div>

        <div className="grid grid-cols-1 gap-10">
          {ongoing.map((project) => (
            <Card key={project.id} className="overflow-hidden border-emerald-100 shadow-xl group">
              <div className="grid grid-cols-1 lg:grid-cols-2">
                <div className="relative h-[300px] lg:h-full overflow-hidden">
                  <img 
                    src={project.image_url || "/placeholder-project.jpg"} 
                    alt={project.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute top-4 left-4 bg-emerald-600 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest shadow-lg">
                    Now Booking
                  </div>
                </div>
                <CardContent className="p-8 space-y-6 bg-white">
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-2">{project.title}</h3>
                    <p className="flex items-center gap-1 text-emerald-700 font-medium">
                      <MapPin size={16} /> {project.location}
                    </p>
                  </div>

                  <p className="text-slate-600 leading-relaxed italic border-l-2 border-slate-100 pl-4">
                    {project.description}
                  </p>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 border-y border-slate-50">
                    <SpecBox icon={<CircleDollarSign size={18}/>} label="Per Share" value={`৳${Number(project.share_amount).toLocaleString()}`} />
                    <SpecBox icon={<BadgePercent size={18}/>} label="Cash Discount" value={`৳${Number(project.at_once_discount).toLocaleString()}`} />
                    <SpecBox icon={<Layers size={18}/>} label="Floors" value={`${project.floors} Storied`} />
                    <SpecBox icon={<Maximize2 size={18}/>} label="Flat Size" value={project.flat_size} />
                  </div>

                  <button className="w-full md:w-auto bg-emerald-900 text-white px-8 py-3 rounded-lg font-bold hover:bg-emerald-800 transition-colors flex items-center justify-center gap-2">
                    Inquire for Details <ArrowRight size={18} />
                  </button>
                </CardContent>
              </div>
            </Card>
          ))}
          {ongoing.length === 0 && <p className="text-slate-400 italic">No ongoing projects at the moment.</p>}
        </div>
      </section>

      {/* 2. FINISHED PROJECTS SECTION */}
      <section className="space-y-8 bg-slate-50 -mx-6 px-6 py-16">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-serif font-bold text-emerald-900">Successfully Completed</h2>
            <p className="text-slate-600">A track record of trust and timely delivery.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {finished.map((project) => (
              <Card key={project.id} className="border-none shadow-md hover:shadow-xl transition-all">
                <div className="h-48 overflow-hidden rounded-t-xl">
                  <img src={project.image_url} alt={project.title} className="w-full h-full object-cover" />
                </div>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-bold text-lg text-slate-900">{project.title}</h3>
                    <CheckCircle2 className="text-emerald-600 shrink-0" size={20} />
                  </div>
                  <p className="text-sm text-slate-600 line-clamp-3 mb-4">{project.description}</p>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                    Completed: {new Date(project.completion_date).toLocaleDateString()}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          {finished.length === 0 && <p className="text-center text-slate-400">Our success stories are being archived.</p>}
        </div>
      </section>

      {/* 3. ROADMAP SECTION */}
      <section className="space-y-12">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-serif font-bold text-emerald-900 flex items-center justify-center gap-3">
            <Construction className="text-emerald-600" /> Future Roadmap
          </h2>
          <p className="text-slate-600">Our strategic vision for the coming years.</p>
        </div>
        
        <div className="relative max-w-4xl mx-auto px-4">
          <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-emerald-100 -translate-x-1/2 hidden md:block"></div>
          
          <div className="space-y-12">
            {roadmap.map((item, idx) => (
              <div key={item.id} className={`relative flex items-center justify-between md:justify-normal group ${idx % 2 === 0 ? 'md:flex-row-reverse' : ''}`}>
                <div className="hidden md:flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-emerald-600 text-white shadow shrink-0 absolute left-1/2 -translate-x-1/2 z-10 group-hover:scale-110 transition-transform">
                  <Clock size={16} />
                </div>
                
                <div className="w-full md:w-[45%] p-6 rounded-2xl border border-emerald-50 bg-white shadow-sm hover:shadow-md transition-shadow">
                  <h4 className="font-bold text-emerald-900 text-xl mb-2">{item.title}</h4>
                  <p className="text-slate-600 text-sm leading-relaxed">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
          {roadmap.length === 0 && <p className="text-center text-slate-400">Future plans are being finalized.</p>}
        </div>
      </section>
    </div>
  );
}

// Sub-components
function SpecBox({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5 text-slate-400">
        {icon}
        <span className="text-[10px] font-bold uppercase tracking-tighter">{label}</span>
      </div>
      <p className="font-bold text-slate-800 text-sm">{value}</p>
    </div>
  );
}