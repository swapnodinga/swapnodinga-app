import Layout from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import heroBg from "@assets/generated_images/housing_community_hero_background.png";

export default function ProjectPage() {
  return (
    <Layout>
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="relative h-64 rounded-xl overflow-hidden mb-8">
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${heroBg})` }}
          />
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <h1 className="text-4xl font-serif font-bold text-white">Our Future Home</h1>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-6">
            <h2 className="text-2xl font-serif font-bold text-primary">Project Overview</h2>
            <p className="text-muted-foreground leading-relaxed">
              The Swapnodinga Model Town project is an ambitious initiative to create a self-sustaining, eco-friendly residential community for our members. Located in the developing outskirts of the city, the project aims to provide affordable yet high-quality living spaces.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              We are currently in the <strong>Land Acquisition Phase</strong>. Our target is to acquire 50 Bighas of land by 2026. Following acquisition, we will begin the master planning and approval process.
            </p>
            
            <h3 className="text-xl font-serif font-bold text-primary mt-6">Key Features</h3>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>Secure gated community</li>
              <li>40% dedicated green space and water bodies</li>
              <li>Community center and playground</li>
              <li>Integrated waste management system</li>
              <li>Solar street lighting</li>
            </ul>
          </div>

          <div className="space-y-6">
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-serif font-bold text-lg mb-4">Project Status</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Fund Collection</span>
                      <span className="font-bold text-primary">35%</span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div className="h-full bg-primary w-[35%]"></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Land Identified</span>
                      <span className="font-bold text-accent">Done</span>
                    </div>
                  </div>
                   <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Land Purchase</span>
                      <span className="font-bold text-muted-foreground">Pending</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-primary text-primary-foreground">
              <CardContent className="pt-6">
                <h3 className="font-serif font-bold text-lg mb-2">Join the Dream</h3>
                <p className="text-sm opacity-90 mb-4">
                  Spaces are limited. Secure your future home today by becoming a regular contributor.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
