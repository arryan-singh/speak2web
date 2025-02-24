
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-[#FDF0D5] p-6 md:p-12">
      <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-8 items-center">
        {/* Left side - Brand section */}
        <div className="space-y-6 animate-slide-in">
          <h1 className="text-4xl md:text-6xl font-bold text-[#780000]">
            Speak2web
          </h1>
          <p className="text-xl md:text-2xl text-[#C1121F] opacity-90">
            Abstract
          </p>
          <p className="text-lg text-[#780000] opacity-80">
            Create stunning websites using the power of AI. Transform your ideas into beautiful, functional web experiences.
          </p>
        </div>

        {/* Right side - Action cards */}
        <div className="space-y-6">
          <Card 
            className="p-6 hover-scale bg-white/80 backdrop-blur border-[#780000]/20 cursor-pointer animate-fade-in"
            style={{ animationDelay: "0.2s" }}
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-[#780000]">Create New</h2>
                <p className="text-[#C1121F] mt-2">Start a fresh project with AI</p>
              </div>
              <ArrowRight className="h-6 w-6 text-[#780000]" />
            </div>
          </Card>

          <Card 
            className="p-6 hover-scale bg-white/80 backdrop-blur border-[#780000]/20 cursor-pointer animate-fade-in"
            style={{ animationDelay: "0.4s" }}
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-[#780000]">Edit Project</h2>
                <p className="text-[#C1121F] mt-2">Continue working on existing projects</p>
              </div>
              <ArrowRight className="h-6 w-6 text-[#780000]" />
            </div>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-12 text-center text-[#780000]/60 animate-fade-in" style={{ animationDelay: "0.6s" }}>
        <p>Powered by advanced AI technology</p>
      </footer>
    </div>
  );
};

export default Index;
