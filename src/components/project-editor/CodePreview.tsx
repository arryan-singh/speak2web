
import React from 'react';
import { Card } from "@/components/ui/card";

interface CodePreviewProps {
  code: string;
  language: string;
  fileName: string;
}

const CodePreview: React.FC<CodePreviewProps> = ({ code, language, fileName }) => {
  return (
    <Card className="p-4 mb-5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-md">
      <div className="flex justify-between items-center mb-3">
        <span className="text-sm font-medium text-gray-700 dark:text-white">{fileName}</span>
        <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-gray-700 dark:text-gray-200 border dark:border-gray-600 font-semibold">
          {language}
        </span>
      </div>
      <pre className="overflow-x-auto p-4 bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700 text-sm">
        <code className="font-mono text-gray-800 dark:text-gray-100">{code}</code>
      </pre>
    </Card>
  );
};

export default CodePreview;
