
import { useEffect } from "react";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import ProjectPreview from "@/components/project-editor/ProjectPreview";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";
import CodeGenerator from "@/components/project-editor/CodeGenerator";

const ProjectEditor = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please login to access the project editor",
        variant: "destructive"
      });
      navigate("/login");
    }
  }, [user, navigate]);

  // If not authenticated, don't render the editor
  if (!user) {
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background dark:bg-gray-900 text-text dark:text-white">
      <ResizablePanelGroup direction="horizontal" className="w-full">
        <ResizablePanel defaultSize={40} minSize={30} maxSize={60}>
          <div className="flex flex-col h-full border-r border-gray-200 dark:border-gray-700 bg-background dark:bg-gray-900">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-background dark:bg-gray-800">
              <h2 className="text-xl font-semibold text-primary dark:text-white">Code Generator</h2>
            </div>
            <CodeGenerator />
          </div>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={60}>
          <ProjectPreview />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};

export default ProjectEditor;
