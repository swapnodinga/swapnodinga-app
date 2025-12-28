import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Save, Phone, Clock, Facebook, Youtube, Instagram, Globe, Loader2 } from "lucide-react";

export default function AdminSettings() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<any>({});

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    const { data } = await supabase.from('site_settings').select('*');
    if (data) {
      const settingsMap = data.reduce((acc: any, item: any) => {
        acc[item.setting_key] = item.setting_value;
        return acc;
      }, {});
      setSettings(settingsMap);
    }
    setLoading(false);
  }

  const handleUpdate = async (key: string, value: string) => {
    setSettings({ ...settings, [key]: value });
  };

  const saveAllSettings = async () => {
    setSaving(true);
    try {
      const updates = Object.keys(settings).map(key => ({
        setting_key: key,
        setting_value: settings[key]
      }));

      // Upsert updates existing keys or inserts if missing
      const { error } = await supabase.from('site_settings').upsert(updates, { onConflict: 'setting_key' });

      if (error) throw error;

      toast({ title: "Settings Updated", description: "All changes are now live on the contact page." });
    } catch (error) {
      toast({ variant: "destructive", title: "Update Failed", description: "Could not save settings." });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-10 text-center"><Loader2 className="animate-spin mx-auto" /></div>;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Site Configuration</h1>
          <p className="text-slate-500 text-sm">Modify contact information and social media links</p>
        </div>
        <Button onClick={saveAllSettings} disabled={saving} className="bg-emerald-700 hover:bg-emerald-800">
          {saving ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />}
          Save All Changes
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-md flex items-center gap-2">
              <Phone className="h-4 w-4 text-emerald-600" /> Primary Contact
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Call Us Number</Label>
              <Input 
                value={settings.contact_phone || ""} 
                onChange={(e) => handleUpdate('contact_phone', e.target.value)}
                placeholder="+880 1XXX-XXXXXX"
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2"><Clock className="h-3 w-3" /> Working Hours</Label>
              <Input 
                value={settings.admin_hours || ""} 
                onChange={(e) => handleUpdate('admin_hours', e.target.value)}
                placeholder="Fri - Wed: 10AM - 8PM"
              />
            </div>
          </CardContent>
        </Card>

        {/* Social Media Links */}
        <Card>
          <CardHeader>
            <CardTitle className="text-md flex items-center gap-2">
              <Globe className="h-4 w-4 text-blue-600" /> Social Networks
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2"><Facebook className="h-3 w-3" /> Facebook URL</Label>
              <Input 
                value={settings.facebook_link || ""} 
                onChange={(e) => handleUpdate('facebook_link', e.target.value)}
                placeholder="https://facebook.com/..."
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2"><Youtube className="h-3 w-3" /> YouTube URL</Label>
              <Input 
                value={settings.youtube_link || ""} 
                onChange={(e) => handleUpdate('youtube_link', e.target.value)}
                placeholder="https://youtube.com/..."
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2"><Instagram className="h-3 w-3" /> Instagram URL</Label>
              <Input 
                value={settings.instagram_link || ""} 
                onChange={(e) => handleUpdate('instagram_link', e.target.value)}
                placeholder="https://instagram.com/..."
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}