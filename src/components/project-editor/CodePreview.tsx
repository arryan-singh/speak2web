
import React from 'react';
import { Card } from "@/components/ui/card";

interface CodePreviewProps {
  code: string;
  language: string;
  fileName: string;
}

const CodePreview: React.FC<CodePreviewProps> = ({ code, language, fileName }) => {
  return (
    <Card className="p-4 mb-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-gray-600 dark:text-gray-300">{fileName}</span>
        <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-gray-600 dark:text-gray-300">
          {language}
        </span>
      </div>
      <pre className="overflow-x-auto p-4 bg-gray-50 dark:bg-gray-900 rounded">
        <code className="text-sm font-mono text-gray-800 dark:text-gray-200">{code}</code>
      </pre>
    </Card>
  );
};

export default CodePreview;
