"use client"

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Save, Loader2, RefreshCw, UserCog, Phone, 
  Globe, Hash, MapPin, Briefcase, Facebook 
} from "lucide-react";

export default function AdminSettings() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<any>({});
  const [committee, setCommittee] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    // Fetch all keys from site_settings
    const { data: sData } = await supabase.from('site_settings').select('*');
    if (sData) {
      const settingsMap = sData.reduce((acc: any, item: any) => {
        acc[item.setting_key] = item.setting_value;
        return acc;
      }, {});
      setSettings(settingsMap);
    }

    // Fetch committee rankings
    const { data: cData } = await supabase.from('committee').select('*').order('rank', { ascending: true });
    
    const defaultRoles = ["Founder & Chairman", "General Secretary", "Executive Member", "Executive Member", "Executive Member", "Executive Member"];
    
    const cleanBoard = Array.from({ length: 6 }).map((_, i) => {
      const existing = cData?.find(m => m.rank === i + 1);
      return existing || { member_id: "", role: defaultRoles[i], rank: i + 1 };
    });
    
    setCommittee(cleanBoard);
    setLoading(false);
  }

  const saveAllData = async () => {
    setSaving(true);
    try {
      // 1. Update Site Settings (including Maps and Project content)
      const updates = Object.keys(settings).map(key => ({
        setting_key: key,
        setting_value: settings[key]
      }));
      await supabase.from('site_settings').upsert(updates, { onConflict: 'setting_key' });

      // 2. Update Committee
      const committeeUpdates = committee.map(m => ({
        member_id: m.member_id || null, 
        role: m.role,
        rank: m.rank
      }));

      const { error } = await supabase
        .from('committee')
        .upsert(committeeUpdates, { onConflict: 'rank' });

      if (error) throw error;
      
      toast({ title: "Configuration Saved Successfully" });
      fetchData();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-emerald-600" /></div>;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8 pb-20">
      <div className="flex justify-between items-center border-b pb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Site Management</h1>
          <p className="text-slate-500 text-sm">Configure public information and board assignments.</p>
        </div>
        <Button onClick={saveAllData} disabled={saving} className="bg-emerald-700 hover:bg-emerald-800 h-11 px-8 shadow-lg">
          {saving ? <RefreshCw className="animate-spin mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />}
          Save All Changes
        </Button>
      </div>

      <Tabs defaultValue="contact" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-8 bg-emerald-50 p-1">
          <TabsTrigger value="contact" className="gap-2"><Phone size={16}/> Contact & Social</TabsTrigger>
          <TabsTrigger value="board" className="gap-2"><UserCog size={16}/> Board Members</TabsTrigger>
          <TabsTrigger value="project" className="gap-2"><Briefcase size={16}/> Our Project</TabsTrigger>
        </TabsList>

        {/* CONTACT & SOCIAL + MAP */}
        <TabsContent value="contact" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle className="text-emerald-800">Communication</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <Label>Public Phone</Label>
                  <Input value={settings.contact_phone || ""} onChange={(e) => setSettings({...settings, contact_phone: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <Label>Office Hours</Label>
                  <Input value={settings.admin_hours || ""} onChange={(e) => setSettings({...settings, admin_hours: e.target.value})} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-emerald-800">Social Links</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <Label className="flex items-center gap-2"><Globe size={14}/> WhatsApp Number</Label>
                  <Input value={settings.whatsapp_number || ""} onChange={(e) => setSettings({...settings, whatsapp_number: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <Label className="flex items-center gap-2"><Facebook size={14}/> Facebook Page URL</Label>
                  <Input value={settings.facebook_url || ""} onChange={(e) => setSettings({...settings, facebook_url: e.target.value})} />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-emerald-200">
            <CardHeader className="bg-emerald-50/30">
              <CardTitle className="flex items-center gap-2"><MapPin size={18} /> Google Maps Location</CardTitle>
              <CardDescription>Paste the Google Maps Embed URL (the "src" attribute from the iframe code).</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <Textarea 
                placeholder="https://www.google.com/maps/embed?pb=..." 
                className="font-mono text-xs h-24"
                value={settings.google_map_url || ""} 
                onChange={(e) => setSettings({...settings, google_map_url: e.target.value})} 
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* BOARD ASSIGNMENTS */}
        <TabsContent value="board">
          <Card className="shadow-lg border-none overflow-hidden">
            <CardHeader className="bg-[#064e3b] text-white"> 
              <CardTitle className="flex items-center gap-2 text-md font-medium"><UserCog size={18} /> Management Committee</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4 bg-slate-50/30">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {committee.map((m, index) => (
                  <div key={index} className="p-4 rounded-xl bg-white border border-slate-200 grid grid-cols-1 gap-3 relative shadow-sm">
                    <div className="absolute -left-2 top-4 bg-emerald-600 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold">{m.rank}</div>
                    <div className="space-y-1 pl-4">
                      <Label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1"><Hash size={10}/> Member Society ID</Label>
                      <Input placeholder="SCS-001" value={m.member_id || ""} onChange={(e) => {
                        const next = [...committee];
                        next[index].member_id = e.target.value;
                        setCommittee(next);
                      }} />
                    </div>
                    <div className="space-y-1 pl-4">
                      <Label className="text-[10px] font-bold text-slate-500 uppercase">Board Role</Label>
                      <Input value={m.role} onChange={(e) => {
                        const next = [...committee];
                        next[index].role = e.target.value;
                        setCommittee(next);
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* OUR PROJECT */}
        <TabsContent value="project">
          <Card className="border-emerald-200">
            <CardHeader className="bg-emerald-50/30">
              <CardTitle className="flex items-center gap-2"><Briefcase size={18} /> Project Page Content</CardTitle>
              <CardDescription>Update the main description and project details for the public project page.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <Label>Project Title</Label>
                <Input 
                  value={settings.project_title || ""} 
                  onChange={(e) => setSettings({...settings, project_title: e.target.value})} 
                />
              </div>
              <div className="space-y-2">
                <Label>Main Content / Description</Label>
                <Textarea 
                  className="min-h-[400px] leading-relaxed"
                  value={settings.project_description || ""} 
                  onChange={(e) => setSettings({...settings, project_description: e.target.value})} 
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}