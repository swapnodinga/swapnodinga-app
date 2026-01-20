"use client"

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Save, Loader2, RefreshCw, UserCog, Phone, MapPin, 
  Globe, Briefcase, Facebook, Plus, Trash2, Image as ImageIcon
} from "lucide-react";

export default function AdminSettings() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<any>({});
  const [committee, setCommittee] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);

  const [newProject, setNewProject] = useState({
    title: "", project_type: "ongoing", description: "", location: "",
    share_amount: "", at_once_discount: "", floors: "", flat_size: "",
    image_url: "", completion_date: ""
  });

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    setLoading(true);
    const { data: sData } = await supabase.from('site_settings').select('*');
    if (sData) {
      const settingsMap = sData.reduce((acc: any, item: any) => {
        acc[item.setting_key] = item.setting_value;
        return acc;
      }, {});
      setSettings(settingsMap);
    }

    const { data: cData } = await supabase.from('committee').select('*').order('rank', { ascending: true });
    setCommittee(Array.from({ length: 6 }).map((_, i) => cData?.find(m => m.rank === i + 1) || { member_id: "", role: "", rank: i + 1 }));

    const { data: pData } = await supabase.from('projects').select('*').order('created_at', { ascending: false });
    if (pData) setProjects(pData);
    setLoading(false);
  }

  const addProject = async (type: string) => {
    setSaving(true);
    try {
      // Fix: Convert empty strings to null for date fields to avoid DB errors
      const projectData = {
        ...newProject,
        project_type: type,
        completion_date: newProject.completion_date || null,
        share_amount: newProject.share_amount ? parseFloat(newProject.share_amount) : 0,
        at_once_discount: newProject.at_once_discount ? parseFloat(newProject.at_once_discount) : 0,
        floors: newProject.floors ? parseInt(newProject.floors) : 0
      };

      const { error } = await supabase.from('projects').insert([projectData]);
      if (error) throw error;
      
      toast({ title: "Project Added Successfully" });
      setNewProject({ title: "", project_type: "ongoing", description: "", location: "", share_amount: "", at_once_discount: "", floors: "", flat_size: "", image_url: "", completion_date: "" });
      fetchData();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } finally { setSaving(false); }
  };

  const saveAllData = async () => {
    setSaving(true);
    try {
      const updates = Object.keys(settings).map(key => ({ setting_key: key, setting_value: settings[key] }));
      await supabase.from('site_settings').upsert(updates, { onConflict: 'setting_key' });
      
      const committeeUpdates = committee.map(m => ({ member_id: m.member_id || null, role: m.role, rank: m.rank }));
      await supabase.from('committee').upsert(committeeUpdates, { onConflict: 'rank' });
      
      toast({ title: "Settings Saved Successfully" });
      fetchData();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } finally { setSaving(false); }
  };

  if (loading) return <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-emerald-600" /></div>;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8 pb-20">
      <div className="flex justify-between items-center border-b pb-6">
        <h1 className="text-3xl font-bold text-slate-900">Site Management</h1>
        <Button onClick={saveAllData} disabled={saving} className="bg-emerald-700 hover:bg-emerald-800">
          {saving ? <RefreshCw className="animate-spin mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />}
          Save Global Config
        </Button>
      </div>

      <Tabs defaultValue="contact">
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="contact">Contact & Address</TabsTrigger>
          <TabsTrigger value="board">Board Members</TabsTrigger>
          <TabsTrigger value="project">Projects CMS</TabsTrigger>
        </TabsList>

        <TabsContent value="contact" className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-sm">Office Location & Contact</CardTitle></CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-1">
                  <Label>Office Physical Address</Label>
                  <Textarea 
                    placeholder="Enter office full address..." 
                    value={settings.office_address || ""} 
                    onChange={(e) => setSettings({...settings, office_address: e.target.value})} 
                  />
                </div>
                <div className="space-y-1">
                  <Label>Public Phone</Label>
                  <Input value={settings.contact_phone || ""} onChange={(e) => setSettings({...settings, contact_phone: e.target.value})} />
                </div>
              </div>
              <div className="space-y-4">
                <div className="space-y-1">
                  <Label>WhatsApp Number (With Country Code)</Label>
                  <Input placeholder="8801XXXXXXXXX" value={settings.whatsapp_number || ""} onChange={(e) => setSettings({...settings, whatsapp_number: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <Label>Google Maps Embed URL</Label>
                  <Input value={settings.google_map_url || ""} onChange={(e) => setSettings({...settings, google_map_url: e.target.value})} />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="project">
           {/* (Project Logic remains as previous, utilizing the new addProject fix) */}
           <div className="p-4 border rounded-lg bg-white">
             <h3 className="font-bold mb-4">Add New Project Entry</h3>
             <div className="grid md:grid-cols-2 gap-4">
                <Input placeholder="Title" value={newProject.title} onChange={(e) => setNewProject({...newProject, title: e.target.value})} />
                <select className="border p-2 rounded" value={newProject.project_type} onChange={(e) => setNewProject({...newProject, project_type: e.target.value})}>
                  <option value="ongoing">Ongoing</option>
                  <option value="finished">Finished</option>
                  <option value="roadmap">Roadmap</option>
                </select>
                <Input type="date" value={newProject.completion_date} onChange={(e) => setNewProject({...newProject, completion_date: e.target.value})} />
                <Button onClick={() => addProject(newProject.project_type)}>Publish Project</Button>
             </div>
           </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}