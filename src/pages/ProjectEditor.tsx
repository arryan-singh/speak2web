
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import ChatInterface from "@/components/project-editor/ChatInterface";
import ProjectPreview from "@/components/project-editor/ProjectPreview";

const ProjectEditor = () => {
  return (
    <div className="flex h-screen overflow-hidden bg-background dark:bg-background text-text dark:text-white">
      <ResizablePanelGroup direction="horizontal" className="w-full">
        <ResizablePanel defaultSize={40} minSize={30} maxSize={60}>
          <ChatInterface />
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
