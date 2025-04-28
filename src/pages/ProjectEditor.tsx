
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import ChatInterface from "@/components/project-editor/ChatInterface";
import ProjectPreview from "@/components/project-editor/ProjectPreview";

const ProjectEditor = () => {
  return (
    <div className="flex h-screen overflow-hidden bg-background dark:bg-background text-text dark:text-white">
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel defaultSize={25} minSize={20} maxSize={40}>
          <ChatInterface />
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={75}>
          <ProjectPreview />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};

export default ProjectEditor;
