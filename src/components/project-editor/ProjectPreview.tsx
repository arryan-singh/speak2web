
import React from "react";
import { Card } from "@/components/ui/card";

const ProjectPreview: React.FC = () => {
  return (
    <div className="w-3/4 bg-background-darker dark:bg-gray-900 p-8 overflow-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-primary dark:text-white mb-2">Project Preview</h1>
        <p className="text-accent dark:text-gray-400">Real-time preview of your project</p>
      </div>
      
      {/* Preview area */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm h-[calc(100%-100px)] overflow-hidden">
        <div className="h-full flex flex-col">
          {/* Preview header */}
          <div className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 p-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-gray-300 dark:bg-gray-500"></div>
              <div className="w-3 h-3 rounded-full bg-gray-300 dark:bg-gray-500"></div>
              <div className="w-3 h-3 rounded-full bg-gray-300 dark:bg-gray-500"></div>
              <div className="flex-1 text-center">
                <span className="text-sm font-medium text-gray-500 dark:text-gray-300">Preview</span>
              </div>
            </div>
          </div>
          
          {/* Preview content */}
          <div className="flex-1 p-8 overflow-auto">
            <div className="text-center max-w-2xl mx-auto">
              <h3 className="text-2xl font-semibold text-primary dark:text-white mb-4">Project Structure</h3>
              <p className="text-accent dark:text-gray-400 mb-8">Your project changes will appear here in real-time</p>
              
              <div className="grid grid-cols-2 gap-6 mt-8">
                <Card className="p-6 hover-scale border border-gray-200 dark:border-gray-700 dark:bg-gray-800">
                  <h4 className="font-medium text-primary dark:text-white text-lg mb-2">Components</h4>
                  <p className="text-sm text-accent dark:text-gray-400">Core building blocks</p>
                </Card>
                <Card className="p-6 hover-scale border border-gray-200 dark:border-gray-700 dark:bg-gray-800">
                  <h4 className="font-medium text-primary dark:text-white text-lg mb-2">Assets</h4>
                  <p className="text-sm text-accent dark:text-gray-400">Media & resources</p>
                </Card>
                <Card className="p-6 hover-scale border border-gray-200 dark:border-gray-700 dark:bg-gray-800">
                  <h4 className="font-medium text-primary dark:text-white text-lg mb-2">Styling</h4>
                  <p className="text-sm text-accent dark:text-gray-400">Design elements</p>
                </Card>
                <Card className="p-6 hover-scale border border-gray-200 dark:border-gray-700 dark:bg-gray-800">
                  <h4 className="font-medium text-primary dark:text-white text-lg mb-2">Logic</h4>
                  <p className="text-sm text-accent dark:text-gray-400">Functional code</p>
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
