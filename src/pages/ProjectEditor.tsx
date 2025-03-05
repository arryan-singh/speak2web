
import ChatInterface from "@/components/project-editor/ChatInterface";
import ProjectPreview from "@/components/project-editor/ProjectPreview";

const ProjectEditor = () => {
  return (
    <div className="flex h-screen overflow-hidden bg-background dark:bg-background text-text dark:text-white">
      {/* Left Section - Chat Interface (1/4 width) */}
      <ChatInterface />
      
      {/* Right Section - Project Preview (3/4 width) */}
      <ProjectPreview />
    </div>
  );
};

export default ProjectEditor;
