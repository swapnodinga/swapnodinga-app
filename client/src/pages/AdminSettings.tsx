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
  Save, Loader2, RefreshCw, UserCog, Phone, 
  Globe, MapPin, Briefcase, Facebook, Plus, Trash2, Image as ImageIcon
} from "lucide-react";

export default function AdminSettings() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<any>({});
  const [committee, setCommittee] = useState<any[]>([]);
  
  // Project Management States
  const [projects, setProjects] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [newProject, setNewProject] = useState({
    title: "",
    project_type: "ongoing",
    description: "",
    location: "",
    share_amount: "",
    at_once_discount: "",
    floors: "",
    flat_size: "",
    image_url: "",
    completion_date: ""
  });

  useEffect(() => {
    fetchData();
  }, []);

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
    const defaultRoles = ["Founder & Chairman", "General Secretary", "Executive Member", "Executive Member", "Executive Member", "Executive Member"];
    const cleanBoard = Array.from({ length: 6 }).map((_, i) => {
      const existing = cData?.find(m => m.rank === i + 1);
      return existing || { member_id: "", role: defaultRoles[i], rank: i + 1 };
    });
    setCommittee(cleanBoard);

    const { data: pData } = await supabase.from('projects').select('*').order('created_at', { ascending: false });
    if (pData) setProjects(pData);

    setLoading(false);
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      const file = e.target.files?.[0];
      if (!file) return;
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `project-pics/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('project-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from('project-images').getPublicUrl(filePath);
      setNewProject({ ...newProject, image_url: data.publicUrl });
      toast({ title: "Image Uploaded" });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Upload Failed", description: error.message });
    } finally {
      setUploading(false);
    }
  };

  const addProject = async (type: string) => {
    setSaving(true);
    try {
      // FIX: Handle empty strings for dates to avoid PostgreSQL error
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
    } finally {
      setSaving(false);
    }
  };

  const deleteProject = async (id: string) => {
    const { error } = await supabase.from('projects').delete().eq('id', id);
    if (!error) {
      toast({ title: "Project Deleted" });
      fetchData();
    }
  };

  const saveAllData = async () => {
    setSaving(true);
    try {
      const updates = Object.keys(settings).map(key => ({ setting_key: key, setting_value: settings[key] }));
      await supabase.from('site_settings').upsert(updates, { onConflict: 'setting_key' });
      const committeeUpdates = committee.map(m => ({ member_id: m.member_id || null, role: m.role, rank: m.rank }));
      await supabase.from('committee').upsert(committeeUpdates, { onConflict: 'rank' });
      toast({ title: "Configuration Saved" });
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
          <p className="text-slate-500 text-sm">Society info, board, and project portfolio.</p>
        </div>
        <Button onClick={saveAllData} disabled={saving} className="bg-emerald-700 hover:bg-emerald-800 h-11 px-8 shadow-lg">
          {saving ? <RefreshCw className="animate-spin mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />}
          Save Global Config
        </Button>
      </div>

      <Tabs defaultValue="contact" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-8 bg-emerald-50 p-1">
          <TabsTrigger value="contact" className="gap-2"><Phone size={16}/> Contact & Address</TabsTrigger>
          <TabsTrigger value="board" className="gap-2"><UserCog size={16}/> Board Members</TabsTrigger>
          <TabsTrigger value="project" className="gap-2"><Briefcase size={16}/> Projects CMS</TabsTrigger>
        </TabsList>

        <TabsContent value="contact" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle className="text-emerald-800 text-sm">Office & Communication</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <Label>Office Physical Address</Label>
                  <Textarea 
                    placeholder="Enter full office address..." 
                    value={settings.office_address || ""} 
                    onChange={(e) => setSettings({...settings, office_address: e.target.value})} 
                  />
                </div>
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
              <CardHeader><CardTitle className="text-emerald-800 text-sm">Social & Digital</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <Label className="flex items-center gap-2"><Globe size={14}/> WhatsApp (Country Code First)</Label>
                  <Input placeholder="8801XXXXXXXXX" value={settings.whatsapp_number || ""} onChange={(e) => setSettings({...settings, whatsapp_number: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <Label className="flex items-center gap-2"><Facebook size={14}/> Facebook URL</Label>
                  <Input value={settings.facebook_url || ""} onChange={(e) => setSettings({...settings, facebook_url: e.target.value})} />
                </div>
              </CardContent>
            </Card>
          </div>
          <Card className="border-emerald-200">
            <CardHeader className="bg-emerald-50/30">
              <CardTitle className="flex items-center gap-2 text-sm"><MapPin size={18} /> Google Maps Embed URL</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <Textarea className="font-mono text-xs h-24" value={settings.google_map_url || ""} onChange={(e) => setSettings({...settings, google_map_url: e.target.value})} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="board">
          <Card className="shadow-lg border-none">
            <CardHeader className="bg-[#064e3b] text-white rounded-t-xl"> 
              <CardTitle className="text-md font-medium uppercase">Management Committee</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4 bg-slate-50/30">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {committee.map((m, index) => (
                  <div key={index} className="p-4 rounded-xl bg-white border border-slate-200 grid grid-cols-1 gap-3 relative shadow-sm">
                    <div className="absolute -left-2 top-4 bg-emerald-600 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold">{m.rank}</div>
                    <div className="space-y-1 pl-4">
                      <Label className="text-[10px] font-bold text-slate-500 uppercase">Member Society ID</Label>
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

        <TabsContent value="project" className="space-y-6">
          <Tabs defaultValue="ongoing" className="bg-white rounded-xl border p-4 shadow-sm">
            <TabsList className="mb-6 bg-slate-100 p-1">
              <TabsTrigger value="ongoing">Ongoing Project</TabsTrigger>
              <TabsTrigger value="finished">Finished Project</TabsTrigger>
              <TabsTrigger value="roadmap">Roadmap</TabsTrigger>
            </TabsList>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
              <div className="space-y-4 p-6 border rounded-xl bg-slate-50/50">
                <h3 className="font-bold text-emerald-900 flex items-center gap-2"><Plus size={18}/> Add New Project Entry</h3>
                <div className="space-y-3">
                  <div className="space-y-1"><Label>Title</Label><Input value={newProject.title} onChange={(e) => setNewProject({...newProject, title: e.target.value})} /></div>
                  
                  <TabsContent value="ongoing" className="space-y-3 m-0">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1"><Label>Location</Label><Input value={newProject.location} onChange={(e) => setNewProject({...newProject, location: e.target.value})} /></div>
                      <div className="space-y-1"><Label>Share Price (৳)</Label><Input type="number" value={newProject.share_amount} onChange={(e) => setNewProject({...newProject, share_amount: e.target.value})} /></div>
                      <div className="space-y-1"><Label>Floors</Label><Input type="number" value={newProject.floors} onChange={(e) => setNewProject({...newProject, floors: e.target.value})} /></div>
                      <div className="space-y-1"><Label>Flat Size (sqft)</Label><Input value={newProject.flat_size} onChange={(e) => setNewProject({...newProject, flat_size: e.target.value})} /></div>
                      <div className="col-span-2 space-y-1"><Label>Discount for Full Payment (৳)</Label><Input type="number" value={newProject.at_once_discount} onChange={(e) => setNewProject({...newProject, at_once_discount: e.target.value})} /></div>
                    </div>
                  </TabsContent>

                  <TabsContent value="finished" className="space-y-3 m-0">
                    <div className="space-y-1"><Label>Completion Date</Label><Input type="date" value={newProject.completion_date} onChange={(e) => setNewProject({...newProject, completion_date: e.target.value})} /></div>
                  </TabsContent>

                  <div className="space-y-1"><Label>Description</Label><Textarea className="h-24" value={newProject.description} onChange={(e) => setNewProject({...newProject, description: e.target.value})} /></div>

                  <div className="space-y-2">
                    <Label>Thumbnail Image</Label>
                    <div className="flex items-center gap-4">
                      <Input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" id="proj-img" />
                      <Label htmlFor="proj-img" className="cursor-pointer flex items-center gap-2 bg-white border px-4 py-2 rounded-md hover:bg-slate-50 border-emerald-200">
                        <ImageIcon size={16}/> {uploading ? "Uploading..." : "Select Photo"}
                      </Label>
                      {newProject.image_url && <span className="text-xs text-emerald-600 font-bold">✓ Ready</span>}
                    </div>
                  </div>

                  <TabsContent value="ongoing" className="m-0 pt-2"><Button onClick={() => addProject('ongoing')} className="w-full bg-emerald-700">Publish Ongoing Project</Button></TabsContent>
                  <TabsContent value="finished" className="m-0 pt-2"><Button onClick={() => addProject('finished')} className="w-full bg-slate-800">Archive as Finished</Button></TabsContent>
                  <TabsContent value="roadmap" className="m-0 pt-2"><Button onClick={() => addProject('roadmap')} className="w-full bg-blue-700">Add to Roadmap</Button></TabsContent>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-bold text-slate-700 uppercase text-xs tracking-widest">Live Database Entries</h3>
                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                  {projects.map((p) => (
                    <div key={p.id} className="flex items-center justify-between p-3 bg-white border rounded-lg shadow-sm">
                      <div className="flex items-center gap-3">
                        <img src={p.image_url || "/placeholder.jpg"} className="w-10 h-10 rounded object-cover border" alt="" />
                        <div><p className="font-bold text-sm leading-tight">{p.title}</p><p className="text-[10px] uppercase font-bold text-emerald-600">{p.project_type}</p></div>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => deleteProject(p.id)} className="text-red-500 hover:bg-red-50"><Trash2 size={16}/></Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Tabs>
        </TabsContent>
      </Tabs>
    </div>
  );
}