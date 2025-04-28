
import React from "react";
import { Card } from "@/components/ui/card";

const ProjectPreview: React.FC = () => {
  return (
    <div className="h-full bg-background-darker dark:bg-gray-900 p-4 overflow-auto flex flex-col">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-primary dark:text-white mb-1">Project Preview</h1>
        <p className="text-accent dark:text-gray-400 text-sm">Real-time preview of your project</p>
      </div>
      
      {/* Preview area */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm flex-grow overflow-hidden">
        <div className="h-full flex flex-col">
          {/* Preview header */}
          <div className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 p-2 flex items-center">
            <div className="flex items-center space-x-1 ml-2">
              <div className="w-2.5 h-2.5 rounded-full bg-red-400"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-400"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-green-400"></div>
            </div>
            <div className="flex-1 text-center">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-300">Preview</span>
            </div>
          </div>
          
          {/* Preview content */}
          <div className="flex-1 p-6 overflow-auto bg-white dark:bg-gray-800">
            <div className="text-center max-w-3xl mx-auto">
              <h3 className="text-xl font-semibold text-primary dark:text-white mb-3">Project Structure</h3>
              <p className="text-accent dark:text-gray-400 mb-6 text-sm">Your project changes will appear here in real-time</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                <Card className="p-4 hover-scale border border-gray-200 dark:border-gray-700 dark:bg-gray-800 transition-all duration-300">
                  <h4 className="font-medium text-primary dark:text-white text-base mb-1">Components</h4>
                  <p className="text-xs text-accent dark:text-gray-400">Core building blocks</p>
                </Card>
                <Card className="p-4 hover-scale border border-gray-200 dark:border-gray-700 dark:bg-gray-800 transition-all duration-300">
                  <h4 className="font-medium text-primary dark:text-white text-base mb-1">Assets</h4>
                  <p className="text-xs text-accent dark:text-gray-400">Media & resources</p>
                </Card>
                <Card className="p-4 hover-scale border border-gray-200 dark:border-gray-700 dark:bg-gray-800 transition-all duration-300">
                  <h4 className="font-medium text-primary dark:text-white text-base mb-1">Styling</h4>
                  <p className="text-xs text-accent dark:text-gray-400">Design elements</p>
                </Card>
                <Card className="p-4 hover-scale border border-gray-200 dark:border-gray-700 dark:bg-gray-800 transition-all duration-300">
                  <h4 className="font-medium text-primary dark:text-white text-base mb-1">Logic</h4>
                  <p className="text-xs text-accent dark:text-gray-400">Functional code</p>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectPreview;
