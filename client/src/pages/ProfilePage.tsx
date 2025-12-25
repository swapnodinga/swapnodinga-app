import { useSociety } from "@/context/SocietyContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  User, 
  Mail, 
  Shield, 
  HelpCircle, 
  MessageSquare, 
  Lock,
  CheckCircle2
} from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

export default function ProfilePage() {
  const { currentUser, updateProfile } = useSociety();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  
  const [formData, setFormData] = useState({
    name: currentUser?.name || "",
    email: currentUser?.email || ""
  });

  // Update form data if currentUser loads late
  useEffect(() => {
    if (currentUser) {
      setFormData({ name: currentUser.name, email: currentUser.email });
    }
  }, [currentUser]);

  if (!currentUser) return null;

  const handleSaveInfo = async () => {
    try {
      await updateProfile({ ...formData });
      setIsEditing(false);
      toast({ title: "Profile Updated", description: "Personal information saved successfully." });
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to save changes." });
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-serif font-bold text-emerald-900">Member Profile</h1>
          <p className="text-muted-foreground">Manage your identity and access support services.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: AVATAR CARD */}
        <div className="space-y-6">
          <Card className="border-emerald-100 shadow-sm overflow-hidden">
            <div className="h-24 bg-emerald-800 flex items-center justify-center relative">
              <div className="h-28 w-28 rounded-full bg-white border-4 border-slate-50 flex items-center justify-center -mb-28 shadow-xl overflow-hidden z-10">
                {currentUser.profilePic ? (
                  <img src={currentUser.profilePic} alt="Profile" className="h-full w-full object-cover" />
                ) : (
                  <div className="bg-emerald-50 h-full w-full flex items-center justify-center">
                    <User size={48} className="text-emerald-800" />
                  </div>
                )}
              </div>
            </div>
            
            <CardContent className="pt-20 text-center">
              <h3 className="font-bold text-xl text-emerald-900">{currentUser.name}</h3>
              <p className="text-sm text-muted-foreground mb-4 font-mono uppercase">{currentUser.society_id}</p>
              
              <div className="flex justify-center gap-2">
                <span className="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-1 rounded-full font-bold uppercase tracking-wider flex items-center gap-1">
                  <CheckCircle2 size={12} /> {currentUser.role}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-emerald-100 shadow-sm">
            <CardHeader className="py-4 border-b bg-slate-50/50">
              <CardTitle className="text-sm flex items-center gap-2 font-bold text-slate-700">
                <Shield size={16} className="text-emerald-600" /> Security
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <Button variant="outline" className="w-full justify-start text-xs border-emerald-100 h-10 hover:bg-emerald-50 text-slate-600">
                <Lock size={14} className="mr-2" /> Request Password Reset
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN: INFO & SUPPORT */}
        <div className="md:col-span-2 space-y-6">
          <Card className="border-emerald-100 shadow-sm">
            <CardHeader className="border-b bg-slate-50/50">
              <CardTitle className="text-lg text-emerald-900 font-bold">Personal Details</CardTitle>
              <CardDescription>Keep your contact information up to date.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-slate-700 font-medium">Full Name</Label>
                  <Input 
                    id="name" 
                    className="focus-visible:ring-emerald-500"
                    value={formData.name} 
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    disabled={!isEditing} 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-700 font-medium">Email Address</Label>
                  <Input 
                    id="email" 
                    className="focus-visible:ring-emerald-500"
                    value={formData.email} 
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    disabled={!isEditing} 
                  />
                </div>
              </div>
              
              <div className="pt-4 flex justify-end gap-3 border-t mt-4">
                {isEditing ? (
                  <>
                    <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>Cancel</Button>
                    <Button size="sm" className="bg-emerald-800 hover:bg-emerald-900" onClick={handleSaveInfo}>
                      Save Changes
                    </Button>
                  </>
                ) : (
                  <Button size="sm" variant="outline" className="border-emerald-200 text-emerald-700 hover:bg-emerald-50" onClick={() => setIsEditing(true)}>
                    Edit Profile Information
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-emerald-100 shadow-sm">
            <CardHeader className="border-b bg-emerald-50/30">
              <CardTitle className="text-lg flex items-center gap-2 text-emerald-900 font-bold">
                <HelpCircle size={20} className="text-emerald-700" /> Support Hub
              </CardTitle>
              <CardDescription>Direct support channels for society members.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <a href="mailto:swapnodinga.scs@gmail.com" className="p-4 border rounded-xl hover:bg-emerald-50/50 transition-all group border-emerald-50 flex items-start gap-3">
                <div className="p-2 bg-emerald-100 rounded-lg text-emerald-700 group-hover:scale-110 transition-transform">
                   <Mail size={18} />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-800">Official Email</h4>
                  <p className="text-[11px] text-slate-500">For documentation and formal requests.</p>
                </div>
              </a>
              <div className="p-4 border rounded-xl hover:bg-emerald-50/50 transition-all group border-emerald-50 cursor-pointer flex items-start gap-3">
                <div className="p-2 bg-emerald-100 rounded-lg text-emerald-700 group-hover:scale-110 transition-transform">
                   <MessageSquare size={18} />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-800">Member FAQ</h4>
                  <p className="text-[11px] text-slate-500">Common questions about interest and fines.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}