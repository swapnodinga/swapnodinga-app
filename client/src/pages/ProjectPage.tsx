import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
  Building2, 
  Map, 
  CheckCircle2, 
  Clock, 
  Construction,
  Coins
} from "lucide-react";

export default function ProjectPage() {
  // Example data - you can make these dynamic later
  const projects = [
    {
      title: "Land Acquisition Phase 1",
      status: "In Progress",
      progress: 65,
      description: "Securing a 5-katha plot for society headquarters and member recreation.",
      icon: Map,
      color: "text-amber-600",
      bgColor: "bg-amber-100"
    },
    {
      title: "Emergency Loan Fund",
      status: "Active",
      progress: 100,
      description: "A liquid reserve maintained for member welfare and low-interest internal loans.",
      icon: Coins,
      color: "text-emerald-600",
      bgColor: "bg-emerald-100"
    },
    {
      title: "Community Business Hub",
      status: "Planning",
      progress: 15,
      description: "Feasibility study for a shared commercial space to generate external revenue.",
      icon: Building2,
      color: "text-blue-600",
      bgColor: "bg-blue-100"
    }
  ];

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-10 animate-in fade-in duration-700">
      
      {/* Header */}
      <div className="border-b pb-8">
        <h1 className="text-4xl font-serif font-bold text-emerald-900">Our Active Projects</h1>
        <p className="text-slate-600 mt-2 text-lg">
          Tracking the growth of our collective investments and future assets.
        </p>
      </div>

      {/* Project Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {projects.map((project, index) => (
          <Card key={index} className="border-emerald-100 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center gap-4">
              <div className={`p-3 rounded-xl ${project.bgColor} ${project.color}`}>
                <project.icon size={24} />
              </div>
              <div>
                <CardTitle className="text-lg">{project.title}</CardTitle>
                <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">
                  {project.status}
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-slate-600 leading-relaxed">
                {project.description}
              </p>
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-medium">
                  <span>Funding Progress</span>
                  <span>{project.progress}%</span>
                </div>
                <Progress value={project.progress} className="h-2 bg-slate-100" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* The Roadmap/Timeline */}
      <div className="bg-white rounded-2xl p-8 border border-emerald-100 shadow-sm">
        <h3 className="text-2xl font-serif font-bold text-emerald-900 mb-8 flex items-center gap-3">
          <Construction className="text-emerald-600" /> Investment Roadmap
        </h3>
        
        <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-emerald-200 before:to-transparent">
          
          {/* Milestone 1 */}
          <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
            <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-emerald-600 text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
              <CheckCircle2 size={18} />
            </div>
            <div className="w-[calc(100%-4rem)] md:w-[45%] p-4 rounded border border-slate-200 bg-white shadow">
              <time className="font-mono text-xs font-bold text-emerald-600">Q4 2024</time>
              <div className="text-slate-900 font-bold">Society Foundation</div>
              <p className="text-sm text-slate-500">Legal registration and initial member onboarding completed.</p>
            </div>
          </div>

          {/* Milestone 2 */}
          <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
            <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-amber-500 text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
              <Clock size={18} />
            </div>
            <div className="w-[calc(100%-4rem)] md:w-[45%] p-4 rounded border border-slate-200 bg-white shadow">
              <time className="font-mono text-xs font-bold text-amber-600">2025 - Present</time>
              <div className="text-slate-900 font-bold">Capital Accumulation</div>
              <p className="text-sm text-slate-500">Monthly instalments and fixed deposits building the core investment fund.</p>
            </div>
          </div>

          {/* Milestone 3 */}
          <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
            <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-200 text-slate-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
              <Building2 size={18} />
            </div>
            <div className="w-[calc(100%-4rem)] md:w-[45%] p-4 rounded border border-slate-200 bg-slate-50 shadow">
              <time className="font-mono text-xs font-bold text-slate-400">Target 2026</time>
              <div className="text-slate-900 font-bold">First Real Estate Purchase</div>
              <p className="text-sm text-slate-500">Scheduled acquisition of residential/commercial land for long-term appreciation.</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
