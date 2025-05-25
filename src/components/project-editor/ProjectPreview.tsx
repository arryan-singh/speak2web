
import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Eye, Code } from "lucide-react";
import CodePreview from "./CodePreview";

interface GeneratedCode {
  html: string;
  css: string;
  js: string;
}

const ProjectPreview: React.FC = () => {
  const [viewMode, setViewMode] = useState<'preview' | 'code'>('preview');
  const [generatedCode, setGeneratedCode] = useState<GeneratedCode | null>(null);

  // Listen for code generation events
  useEffect(() => {
    const handleUpdatePreview = (event: CustomEvent<GeneratedCode>) => {
      setGeneratedCode(event.detail);
    };

    // Use type assertion to handle CustomEvent
    window.addEventListener('updateProjectPreview', handleUpdatePreview as EventListener);
    
    return () => {
      window.removeEventListener('updateProjectPreview', handleUpdatePreview as EventListener);
    };
  }, []);

  const renderPreview = () => {
    if (!generatedCode) {
      return (
        <div className="text-center max-w-3xl mx-auto">
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-3">Project Preview</h3>
          <p className="text-gray-600 dark:text-gray-200 mb-6 text-sm">Generate some code to see a preview here</p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
            <Card className="p-4 hover-scale border border-gray-200 dark:border-gray-700 dark:bg-gray-800 transition-all duration-300">
              <h4 className="font-medium text-gray-800 dark:text-white text-base mb-1">Components</h4>
              <p className="text-xs text-gray-600 dark:text-gray-300">Core building blocks</p>
            </Card>
            <Card className="p-4 hover-scale border border-gray-200 dark:border-gray-700 dark:bg-gray-800 transition-all duration-300">
              <h4 className="font-medium text-gray-800 dark:text-white text-base mb-1">Assets</h4>
              <p className="text-xs text-gray-600 dark:text-gray-300">Media & resources</p>
            </Card>
            <Card className="p-4 hover-scale border border-gray-200 dark:border-gray-700 dark:bg-gray-800 transition-all duration-300">
              <h4 className="font-medium text-gray-800 dark:text-white text-base mb-1">Styling</h4>
              <p className="text-xs text-gray-600 dark:text-gray-300">Design elements</p>
            </Card>
            <Card className="p-4 hover-scale border border-gray-200 dark:border-gray-700 dark:bg-gray-800 transition-all duration-300">
              <h4 className="font-medium text-gray-800 dark:text-white text-base mb-1">Logic</h4>
              <p className="text-xs text-gray-600 dark:text-gray-300">Functional code</p>
            </Card>
          </div>
        </div>
      );
    }

    if (viewMode === 'preview') {
      // Create iframe with generated code
      const combinedCode = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>${generatedCode.css}</style>
        </head>
        <body>
          ${generatedCode.html}
          <script>${generatedCode.js}</script>
        </body>
        </html>
      `;
      
      // Using srcdoc for the iframe to load the HTML directly
      return (
        <div className="w-full h-full bg-white dark:bg-gray-700 rounded-lg overflow-hidden shadow-inner">
          <iframe 
            srcDoc={combinedCode}
            title="Project Preview"
            className="w-full h-full border-0"
            sandbox="allow-scripts allow-popups"
          />
        </div>
      );
    } else {
      // Show code view with tabs
      return (
        <div className="space-y-4 p-2">
          <CodePreview code={generatedCode.html} language="HTML" fileName="index.html" />
          <CodePreview code={generatedCode.css} language="CSS" fileName="style.css" />
          <CodePreview code={generatedCode.js} language="JavaScript" fileName="script.js" />
        </div>
      );
    }
  };

  return (
    <div className="h-[calc(100vh-8.5rem)] bg-gray-100 dark:bg-gray-900 p-4 overflow-hidden flex flex-col">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-1">Project Preview</h1>
          <p className="text-gray-600 dark:text-gray-300 text-sm">Real-time preview of your project</p>
        </div>
        
        {/* Completely redesigned toggle buttons with maximum contrast */}
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('preview')}
            className={`flex items-center px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 border-2 ${
              viewMode === 'preview'
                ? 'bg-blue-600 text-white border-blue-600 shadow-lg'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </button>
          <button
            onClick={() => setViewMode('code')}
            className={`flex items-center px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 border-2 ${
              viewMode === 'code'
                ? 'bg-blue-600 text-white border-blue-600 shadow-lg'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <Code className="h-4 w-4 mr-2" />
            Code
          </button>
        </div>
      </div>
      
      {/* Preview/Code area */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm flex-grow overflow-hidden flex flex-col">
        {/* Preview header */}
        <div className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 p-3 flex items-center">
          <div className="flex items-center space-x-1 ml-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
          </div>
          <div className="flex-1 text-center">
            <span className="text-sm font-medium text-gray-700 dark:text-white">
              {viewMode === 'preview' ? 'Live Preview' : 'Code View'}
            </span>
          </div>
        </div>
        
        {/* Preview content */}
        <div className="flex-1 overflow-auto bg-white dark:bg-gray-800 p-6">
          {renderPreview()}
        </div>
      </div>
    </div>
  );
};

export default ProjectPreview;
