import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AboutPage() {
  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-serif font-bold text-primary">About Swapnodinga</h1>
          <p className="text-muted-foreground text-lg">Building a secure future through cooperation and shared dreams.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Our Mission</CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none text-muted-foreground">
            <p>
              Swapnodinga Cooperative Society was founded with a singular vision: to empower our members to achieve the dream of homeownership. In a world where real estate prices are skyrocketing, we believe that collective action is the key to financial security.
            </p>
            <p className="mt-4">
              By pooling our resources through monthly instalments and fixed deposits, we are building a substantial fund dedicated to purchasing land and developing a sustainable housing community for all our members.
            </p>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-accent">Transparency</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Every transaction is recorded and visible. We believe trust is the foundation of our society.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-accent">Growth</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Your investments grow with us. We offer competitive interest rates on fixed deposits.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-accent">Community</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                More than just financial partners, we are a community of like-minded individuals building a home.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
