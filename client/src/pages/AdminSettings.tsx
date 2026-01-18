"use client"

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Save, Loader2, RefreshCw, UserCog, Phone, Globe, Hash } from "lucide-react";

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
    setLoading(false);
  }

  const saveAllData = async () => {
    setSaving(true);
    try {
      // 1. Update Site Settings
      const updates = Object.keys(settings).map(key => ({
        setting_key: key,
        setting_value: settings[key]
      }));
      await supabase.from('site_settings').upsert(updates, { onConflict: 'setting_key' });

      // 2. Update Committee using rank as the conflict target
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
    <div className="max-w-5xl mx-auto p-6 space-y-8 pb-20">
      <div className="flex justify-between items-center border-b pb-6">
        <h1 className="text-3xl font-bold text-slate-900">Society Config</h1>
        <Button onClick={saveAllData} disabled={saving} className="bg-emerald-700 hover:bg-emerald-800">
          {saving ? <RefreshCw className="animate-spin mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />}
          Save All
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="space-y-6">
          <Card className="shadow-sm">
            <CardHeader><CardTitle className="text-sm flex items-center gap-2 text-emerald-700"><Phone size={16}/> Contact</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <Input placeholder="Phone" value={settings.contact_phone || ""} onChange={(e) => setSettings({...settings, contact_phone: e.target.value})} />
              <Input placeholder="Hours" value={settings.admin_hours || ""} onChange={(e) => setSettings({...settings, admin_hours: e.target.value})} />
            </CardContent>
          </Card>
          <Card className="border-emerald-100 shadow-md">
            <CardHeader className="bg-emerald-50/30"><CardTitle className="text-sm flex items-center gap-2 text-emerald-800"><Globe size={16}/> Socials</CardTitle></CardHeader>
            <CardContent className="space-y-4 pt-4">
              <Input placeholder="WhatsApp" value={settings.whatsapp_number || ""} onChange={(e) => setSettings({...settings, whatsapp_number: e.target.value})} />
              <Input placeholder="Facebook" value={settings.facebook_url || ""} onChange={(e) => setSettings({...settings, facebook_url: e.target.value})} />
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card className="shadow-lg border-none">
            <CardHeader className="bg-[#064e3b] text-white"> 
              <CardTitle className="flex items-center gap-2 text-md font-medium"><UserCog size={18} /> Board Assignments</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4 bg-slate-50/30">
              {committee.map((m, index) => (
                <div key={index} className="p-4 rounded-xl bg-white border border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-4 relative">
                  <div className="absolute -left-2 top-1/2 -translate-y-1/2 bg-slate-800 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold">{m.rank}</div>
                  <div className="space-y-1 pl-4">
                    <Label className="text-[10px] font-bold text-emerald-600 uppercase flex items-center gap-1"><Hash size={10}/> Member Society ID</Label>
                    <Input placeholder="e.g. SCS-001" value={m.member_id || ""} onChange={(e) => {
                      const next = [...committee];
                      next[index].member_id = e.target.value;
                      setCommittee(next);
                    }} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] font-bold text-emerald-600 uppercase">Role</Label>
                    <Input value={m.role} onChange={(e) => {
                      const next = [...committee];
                      next[index].role = e.target.value;
                      setCommittee(next);
                    }} />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}