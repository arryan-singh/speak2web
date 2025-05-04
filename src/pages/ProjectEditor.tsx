
import { useEffect, useState } from "react";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import ProjectPreview from "@/components/project-editor/ProjectPreview";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";
import CodeGenerator from "@/components/project-editor/CodeGenerator";
import { supabase } from "@/integrations/supabase/client";
import ApiKeySetup from "@/components/project-editor/ApiKeySetup";
import { Button } from "@/components/ui/button";
import { Home, Sun, Moon } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { UserMenu } from "@/components/UserMenu";
import { useTheme } from "@/contexts/ThemeContext";

const ProjectEditor = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isApiKeyConfigured, setIsApiKeyConfigured] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { theme } = useTheme();

  // Check if a Gemini API key is stored in the database
  useEffect(() => {
    const checkApiKey = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('api_keys')
          .select('key_value')
          .eq('service_name', 'gemini')
          .maybeSingle();
        
        if (error) {
          console.error("Error checking API key:", error);
          throw error;
        }
        
        setIsApiKeyConfigured(!!data?.key_value);
      } catch (error) {
        console.error("Failed to check API key configuration:", error);
        toast({
          title: "Configuration Error",
          description: "Could not verify API key configuration. Will attempt auto-setup.",
          variant: "destructive"
        });
        setIsApiKeyConfigured(false);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkApiKey();
  }, []);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user && !isLoading) {
      toast({
        title: "Authentication Required",
        description: "Please login to access the project editor",
        variant: "destructive"
      });
      navigate("/login");
    }
  }, [user, navigate, isLoading]);

  // If not authenticated, don't render the editor
  if (!user && !isLoading) {
    return null;
  }

  const handleApiKeyConfigured = () => {
    setIsApiKeyConfigured(true);
  };

  const navigateToHome = () => {
    navigate('/');
    toast({
      title: "Returning to Home",
      description: "Navigating to the main page"
    });
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-white dark:bg-gray-900 text-gray-800 dark:text-white">
      {/* Fixed Navigation Bar with higher z-index */}
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between py-3 px-6 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={navigateToHome} 
            className="hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
            aria-label="Return to home page"
          >
            <Home className="h-5 w-5 text-gray-700 dark:text-gray-300" />
          </Button>
          <h1 className="text-xl font-semibold text-gray-800 dark:text-white">Speak2web Editor</h1>
        </div>
        <div className="flex items-center gap-6">
          <ThemeToggle />
          <UserMenu />
        </div>
      </header>

      {/* Main Content with padding-top to account for fixed header */}
      <div className="flex-1 mt-14">
        <ResizablePanelGroup direction="horizontal" className="w-full">
          <ResizablePanel defaultSize={40} minSize={30} maxSize={60}>
            <div className="flex flex-col h-full border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Code Generator</h2>
              </div>
              
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="flex flex-col items-center gap-2">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent dark:border-blue-500"></div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Loading configuration...</p>
                  </div>
                </div>
              ) : !isApiKeyConfigured ? (
                <div className="p-4 overflow-y-auto">
                  <ApiKeySetup onKeyConfigured={handleApiKeyConfigured} />
                </div>
              ) : (
                <CodeGenerator />
              )}
            </div>
          </ResizablePanel>
          <ResizableHandle withHandle className="bg-gray-100 dark:bg-gray-800" />
          <ResizablePanel defaultSize={60}>
            <ProjectPreview />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
};

export default ProjectEditor;
