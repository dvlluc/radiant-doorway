import { SEO } from "@/components/SEO";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Handshake, Users, Sparkles, Monitor, Leaf, Recycle, Heart, Check, ArrowRight } from "lucide-react";

const Impact = () => {
  return (
    <>
      <SEO 
        title="Our Impact - BelloNecta"
        description="Transforming the beauty industry by connecting professionals, empowering creativity, and building a sustainable future for beauty."
      />
      <div className="min-h-screen bg-background">
        <main className="flex-1 bg-background">
          <div className="max-w-7xl mx-auto px-6 py-12">
            {/* Hero Section */}
            <div className="text-center mb-16">
              <h1 className="text-4xl font-bold mb-4 text-center" style={{ fontFamily: "'Playfair Display', serif" }}>Our Impact</h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Transforming the beauty industry by connecting professionals, empowering creativity,
                and building a sustainable future for beauty.
              </p>
            </div>

            {/* Beauty Partnership Card */}
            <Card className="mb-16 border-2">
              <CardContent className="p-8">
                <div className="flex items-start justify-between gap-8">
                  <div className="flex gap-6 flex-1">
                    <div className="flex-shrink-0">
                      <Handshake className="w-8 h-8 text-black" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold mb-4">Bello Partnership</h2>
                      <p className="text-muted-foreground text-lg">
                      We are developing partnerships with organizations that share our values to create positive impact in communities through beauty industry collaboration.
                      </p>
                    </div>
                  </div>
                  <Button className="flex-shrink-0" asChild>
                    <a href="/bello-partnership">
                      Learn More <ArrowRight className="ml-2 w-4 h-4" />
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Stats Section */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
              <div className="flex flex-col items-center">
                <div className="w-24 h-24 rounded-full bg-black flex items-center justify-center mb-4">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-center">Creator Economy</h3>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-24 h-24 rounded-full bg-black flex items-center justify-center mb-4">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-center">Style Discovery</h3>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-24 h-24 rounded-full bg-black flex items-center justify-center mb-4">
                  <Monitor className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-center">Beauty Technology</h3>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-24 h-24 rounded-full bg-black flex items-center justify-center mb-4">
                  <Heart className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-center">Beauty Impact</h3>
              </div>
            </div>

            {/* Beauty & Healing Section */}
            <Card className="mb-16 border-2">
              <CardContent className="p-12">
                <h2 className="text-3xl font-bold text-center mb-6" style={{ fontFamily: "'Playfair Display', serif" }}>Beauty & Healing</h2>
                <div className="max-w-3xl mx-auto text-center">
                  <p className="text-lg text-muted-foreground mb-4">
                    Beauty can play a powerful role in restoring confidence and supporting personal healing.
                  </p>
                  <p className="text-lg text-muted-foreground">
                    Our initiative aims to connect individuals experiencing hair loss due to illness or medical treatment with skilled beauty professionals who offer styling guidance, wig support, and restorative services.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Sustainability Initiative Section */}
            <div className="bg-black text-white rounded-lg p-12 mb-16">
              <h2 className="text-3xl font-bold text-center mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>Sustainability Initiative</h2>
              <p className="text-center text-lg mb-12 text-gray-300">
                We're committed to promoting eco-friendly practices in the beauty industry
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 mx-auto mb-4">
                    <Recycle className="w-16 h-16" />
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-center">Zero Waste Goals</h3>
                  <p className="text-gray-300 text-center max-w-sm">
                    Promoting sustainable packaging and waste reduction
                  </p>
                </div>
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 mx-auto mb-4">
                    <Leaf className="w-16 h-16" />
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-center">Eco-Friendly Products</h3>
                  <p className="text-gray-300 text-center max-w-sm">
                    Highlighting brands with sustainable practices
                  </p>
                </div>
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 mx-auto mb-4">
                    <Heart className="w-16 h-16" />
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-center">Community Impact</h3>
                  <p className="text-gray-300 text-center max-w-sm">
                    Supporting local communities and ethical practices
                  </p>
                </div>
              </div>
            </div>

            {/* Future Goals Section */}
            <Card className="border-2">
              <CardContent className="p-12">
                <h2 className="text-3xl font-bold text-center mb-12" style={{ fontFamily: "'Playfair Display', serif" }}>Future Goals</h2>
                <div className="grid grid-cols-1 gap-8">
                  <div className="flex gap-6">
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                      <Check className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-2">Building a Global Beauty Ecosystem</h3>
                      <p className="text-muted-foreground">
                        Connecting professionals, clients, brands, and educators in one platform designed for discovery, booking, and collaboration.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-6">
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                      <Check className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-2">Empowering Beauty Creators</h3>
                      <p className="text-muted-foreground">
                        Giving stylists the tools to showcase their creativity, grow their audience, and turn their styles into bookable experiences.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-6">
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                      <Check className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-2">Advancing Beauty Through Technology</h3>
                      <p className="text-muted-foreground">
                        Exploring innovations such as AI and VR to help users visualize styles and discover beauty in new ways.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-6">
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                      <Check className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-2">Supporting the Business of Beauty</h3>
                      <p className="text-muted-foreground">
                        Creating tools that help beauty professionals manage their services, grow their brands, and sell products.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-6">
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                      <Check className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-2">Creating Positive Impact Through Beauty</h3>
                      <p className="text-muted-foreground">
                        Promoting sustainable beauty practices and supporting individuals experiencing hair loss through our impact initiatives.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </>
  );
};

export default Impact;
