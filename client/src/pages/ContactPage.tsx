"use client"

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import emailjs from '@emailjs/browser'; 
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
  MapPin,
  Loader2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ContactPage() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [settings, setSettings] = useState<any>({
    contact_phone: "+880 1XXX-XXXXXX",
    admin_hours: "Fri - Wed: 10AM - 8PM",
    facebook_url: "#",
    youtube_link: "#",
    instagram_link: "#",
    google_map_url: "" // Dynamic map URL
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
      const { error: supabaseError } = await supabase.from('contact_inquiries').insert([payload]);
      if (supabaseError) throw supabaseError;

      await emailjs.send(
        "service_b8gcj9p",
        "template_55k0e9l",
        {
          from_name: fullName, 
          from_email: email,   
          subject: subject,    
          message: message,    
        },
        "nKSxYmGpgJuB2J4tF"
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
    <div className="max-w-6xl mx-auto p-6 space-y-10 animate-in fade-in duration-700 pb-20">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-serif font-bold text-emerald-900">Get in Touch</h1>
        <p className="text-slate-600">Have a question or need assistance? We're here to help.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sidebar Info */}
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
                <SocialIcon href={settings.facebook_url} icon={<Facebook size={20} />} />
                <SocialIcon href={settings.instagram_link} icon={<Instagram size={20} />} />
                <SocialIcon href={settings.youtube_link} icon={<Youtube size={20} />} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Contact Form */}
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

      {/* NEW: GOOGLE MAPS SECTION */}
      <div className="space-y-6">
        <h2 className="text-2xl font-serif font-bold text-emerald-900 flex items-center gap-2">
          <MapPin className="text-emerald-700" /> Visit Our Office
        </h2>
        <Card className="overflow-hidden border-emerald-100 shadow-lg h-[450px] bg-slate-100">
          {settings.google_map_url ? (
            <iframe
              src={settings.google_map_url}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Society Office Location"
            ></iframe>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-2">
              <MapPin size={48} className="opacity-20" />
              <p>Office map location has not been configured by Admin.</p>
            </div>
          )}
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
    <a 
      href={href === "#" ? undefined : href} 
      target="_blank" 
      rel="noopener noreferrer" 
      className="p-2 bg-emerald-800 hover:bg-emerald-700 rounded-full transition-colors"
    >
      {icon}
    </a>
  );
}