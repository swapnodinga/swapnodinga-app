import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import emailjs from '@emailjs/browser'; // Ensure you ran npm install @emailjs/browser
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Mail, 
  Phone, 
  Send, 
  MessageCircle,
  Clock,
  Facebook,
  Youtube,
  Instagram,
  Twitter,
  Loader2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ContactPage() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [settings, setSettings] = useState<any>({
    contact_phone: "+880 1XXX-XXXXXX",
    admin_hours: "Fri - Wed: 10AM - 8PM",
    facebook_link: "#",
    youtube_link: "#",
    instagram_link: "#"
  });

  // Fetch dynamic settings from Supabase
  useEffect(() => {
    async function fetchSettings() {
      const { data } = await supabase.from('site_settings').select('setting_key, setting_value');
      if (data) {
        const settingsMap = data.reduce((acc: any, item: any) => {
          acc[item.setting_key] = item.setting_value;
          return acc;
        }, {});
        setSettings((prev: any) => ({ ...prev, ...settingsMap }));
      }
    }
    fetchSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const fullName = formData.get('name') as string;
    const email = formData.get('email') as string;
    const subject = formData.get('subject') as string;
    const message = formData.get('message') as string;

    const payload = {
      full_name: fullName,
      email: email,
      subject: subject,
      message: message,
      status: 'New'
    };

    try {
      // 1. Save message to Supabase for Admin records
      const { error: supabaseError } = await supabase.from('contact_inquiries').insert([payload]);
      if (supabaseError) throw supabaseError;

      // 2. Send email via EmailJS
      // Variables below match your {{placeholder}} names in image_e37bbf
      await emailjs.send(
        "service_b8gcj9p", // Your Service ID
        "template_55k0e9l", // Your Template ID
        {
          from_name: fullName, 
          from_email: email,   
          subject: subject,    
          message: message,    
        },
        "nKSxYmGpgJuB2J4tF" // Your Public Key
      );

      toast({
        title: "Message Sent Successfully",
        description: "Thank you for reaching out. We have received your inquiry.",
      });
      
      (e.target as HTMLFormElement).reset();
    } catch (error) {
      console.error("Submission error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not send message. Please try again later.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-10 animate-in fade-in duration-700">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-serif font-bold text-emerald-900">Get in Touch</h1>
        <p className="text-slate-600">Have a question or need assistance? We're here to help.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="space-y-4">
          <ContactInfoCard 
            icon={<Mail />} 
            title="Email Us" 
            value="swapnodinga.scs@gmail.com" 
          />
          <ContactInfoCard 
            icon={<Phone />} 
            title="Call Us" 
            value={settings.contact_phone} 
          />
          <ContactInfoCard 
            icon={<Clock />} 
            title="Admin Hours" 
            value={settings.admin_hours} 
          />

          <Card className="border-emerald-100 shadow-sm bg-emerald-900 text-white">
            <CardContent className="p-6">
              <h4 className="font-bold mb-4">Follow Our Socials</h4>
              <div className="flex gap-4">
                <SocialIcon href={settings.facebook_link} icon={<Facebook size={20} />} />
                <SocialIcon href={settings.instagram_link} icon={<Instagram size={20} />} />
                <SocialIcon href={settings.youtube_link} icon={<Youtube size={20} />} />
                <SocialIcon href="#" icon={<Twitter size={20} />} />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="lg:col-span-2 border-emerald-100 shadow-md">
          <CardHeader className="bg-slate-50/50 border-b">
            <CardTitle className="text-xl flex items-center gap-2">
              <MessageCircle className="text-emerald-700" /> Send a Message
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Your Name</Label>
                  <Input name="name" id="name" placeholder="Full Name" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input name="email" id="email" type="email" placeholder="email@example.com" required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input name="subject" id="subject" placeholder="What is this regarding?" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea name="message" id="message" placeholder="Tell us how we can help..." className="min-h-[150px]" required />
              </div>
              <Button disabled={isSubmitting} type="submit" className="w-full md:w-auto bg-emerald-800 hover:bg-emerald-900 px-8">
                {isSubmitting ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Send className="mr-2 h-4 w-4" />}
                {isSubmitting ? "Sending..." : "Send Message"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Reusable Components
function ContactInfoCard({ icon, title, value }: any) {
  return (
    <Card className="border-emerald-100 shadow-sm">
      <CardContent className="p-6 flex items-start gap-4">
        <div className="p-3 bg-emerald-50 rounded-lg text-emerald-700">{icon}</div>
        <div>
          <h4 className="font-bold text-emerald-900">{title}</h4>
          <p className="text-sm text-slate-500">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function SocialIcon({ href, icon }: { href: string, icon: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="p-2 bg-emerald-800 hover:bg-emerald-700 rounded-full transition-colors">
      {icon}
    </a>
  );
}