import { Card, CardContent } from "@/components/ui/card";
import { 
  Users, 
  Target, 
  ShieldCheck, 
  Handshake, 
  Globe,
  Award
} from "lucide-react";

export default function AboutPage() {
  return (
    <div className="max-w-5xl mx-auto p-6 space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Hero Section */}
      <div className="text-center space-y-4 py-8">
        <h1 className="text-4xl md:text-5xl font-serif font-bold text-emerald-900">
          Our Vision, Our Future
        </h1>
        <p className="text-xl text-emerald-700 font-medium max-w-2xl mx-auto">
          Building financial security through collective savings and mutual trust since 2024.
        </p>
      </div>

      {/* The Story Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-emerald-800 flex items-center gap-2">
            <Users className="h-6 w-6" /> The Swapnodinga Story
          </h2>
          <p className="text-slate-600 leading-relaxed">
            Swapnodinga (স্বপ্নডিঙা) was founded on the principle that small, 
            consistent savings can create monumental opportunities. What started 
            as a small group of like-minded individuals has grown into a structured 
            Savings and Credit Society dedicated to the economic upliftment of its members.
          </p>
          <p className="text-slate-600 leading-relaxed">
            Our platform digitizes the traditional "Samity" model, ensuring 
            transparency, real-time tracking, and fair interest distribution for every 
            single taka contributed.
          </p>
        </div>
        <div className="bg-emerald-900 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden">
          <div className="relative z-10 space-y-6">
            <h3 className="text-xl font-bold border-b border-emerald-700 pb-2">Our Core Values</h3>
            <ul className="space-y-4">
              <li className="flex gap-3">
                <ShieldCheck className="h-6 w-6 text-emerald-400 shrink-0" />
                <span><strong>Absolute Transparency:</strong> Every transaction is logged and viewable.</span>
              </li>
              <li className="flex gap-3">
                <Handshake className="h-6 w-6 text-emerald-400 shrink-0" />
                <span><strong>Equity:</strong> Profit is distributed proportionally based on your contribution.</span>
              </li>
              <li className="flex gap-3">
                <Target className="h-6 w-6 text-emerald-400 shrink-0" />
                <span><strong>Stability:</strong> Disciplined savings ensure a safety net for all.</span>
              </li>
            </ul>
          </div>
          <div className="absolute -bottom-10 -right-10 opacity-10">
            <Globe size={200} />
          </div>
        </div>
      </div>

      {/* Mission & Vision Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-none shadow-md bg-white">
          <CardContent className="p-8 space-y-3">
            <div className="h-12 w-12 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-700 mb-4">
              <Target size={28} />
            </div>
            <h3 className="text-xl font-bold text-emerald-900">Our Mission</h3>
            <p className="text-slate-600">
              To provide a reliable digital framework for community-based savings, 
              empowering members to reach their personal financial milestones 
              through collective strength.
            </p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md bg-white">
          <CardContent className="p-8 space-y-3">
            <div className="h-12 w-12 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-700 mb-4">
              <Award size={28} />
            </div>
            <h3 className="text-xl font-bold text-emerald-900">Our Vision</h3>
            <p className="text-slate-600">
              To become the most trusted and transparent digital credit society 
              platform, fostering a culture of financial literacy and shared 
              prosperity.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Footer Quote */}
      <div className="text-center py-12 border-t">
        <blockquote className="text-2xl font-serif italic text-emerald-800">
          "Individually we are a drop, together we are an ocean."
        </blockquote>
      </div>
    </div>
  );
}
