import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Mail, 
  Phone, 
  MapPin, 
  Send, 
  MessageCircle,
  Clock
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ContactPage() {
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Message Sent",
      description: "Thank you for reaching out. An admin will respond shortly.",
    });
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-10 animate-in fade-in duration-700">
      
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-serif font-bold text-emerald-900">Get in Touch</h1>
        <p className="text-slate-600">Have a question or need assistance? We're here to help.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Contact Info Cards */}
        <div className="space-y-4">
          <Card className="border-emerald-100 shadow-sm">
            <CardContent className="p-6 flex items-start gap-4">
              <div className="p-3 bg-emerald-50 rounded-lg text-emerald-700">
                <Mail size={24} />
              </div>
              <div>
                <h4 className="font-bold text-emerald-900">Email Us</h4>
                <p className="text-sm text-slate-500">swapnodinga.scs@gmail.com</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-emerald-100 shadow-sm">
            <CardContent className="p-6 flex items-start gap-4">
              <div className="p-3 bg-emerald-50 rounded-lg text-emerald-700">
                <Phone size={24} />
              </div>
              <div>
                <h4 className="font-bold text-emerald-900">Call Us</h4>
                <p className="text-sm text-slate-500">+880 1XXX-XXXXXX</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-emerald-100 shadow-sm">
            <CardContent className="p-6 flex items-start gap-4">
              <div className="p-3 bg-emerald-50 rounded-lg text-emerald-700">
                <Clock size={24} />
              </div>
              <div>
                <h4 className="font-bold text-emerald-900">Admin Hours</h4>
                <p className="text-sm text-slate-500">Fri - Wed: 10AM - 8PM</p>
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
                  <Input id="name" placeholder="Full Name" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input id="email" type="email" placeholder="email@example.com" required />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input id="subject" placeholder="What is this regarding?" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea 
                  id="message" 
                  placeholder="Tell us how we can help..." 
                  className="min-h-[150px]" 
                  required 
                />
              </div>

              <Button type="submit" className="w-full md:w-auto bg-emerald-800 hover:bg-emerald-900 px-8">
                <Send className="mr-2 h-4 w-4" /> Send Message
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Map Placeholder */}
      <Card className="overflow-hidden border-emerald-100 shadow-sm">
        <div className="bg-slate-200 h-48 flex items-center justify-center text-slate-400 italic">
          <MapPin className="mr-2" /> Registered Office: Dhaka, Bangladesh
        </div>
      </Card>
    </div>
  );
}
