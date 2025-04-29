
import React, { useState } from 'react';
import { generateCodeAsJson, getGeminiApiKey } from '@/services/geminiService';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface GeneratedCode {
  html: string;
  css: string;
  js: string;
}

const CodeGenerator = () => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<GeneratedCode | null>(null);
  const [activeTab, setActiveTab] = useState<'html' | 'css' | 'js' | 'preview'>('html');
  
  const handleGenerateCode = async () => {
    if (prompt.trim() === '') {
      toast({
        title: "Empty Prompt",
        description: "Please enter a description of the code you want to generate.",
        variant: "destructive"
      });
      return;
    }
    
    setIsGenerating(true);
    try {
      const apiKey = await getGeminiApiKey();
      if (!apiKey) {
        toast({
          title: "API Key Required",
          description: "Please set up your Gemini API key first.",
          variant: "destructive"
        });
        setIsGenerating(false);
        return;
      }
      
      const code = await generateCodeAsJson(apiKey, prompt);
      if (code) {
        setGeneratedCode(code);
        toast({
          title: "Code Generated",
          description: "Your code has been successfully generated!"
        });
      } else {
        toast({
          title: "Generation Failed",
          description: "Failed to generate code. Please try a different prompt.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const renderPreview = () => {
    if (!generatedCode) return null;
    
    // Create a blob URL for the preview
    const htmlContent = `
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
    
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    return (
      <iframe 
        src={url} 
        className="w-full h-[500px] border-2 border-gray-200 rounded-lg"
        title="Code Preview"
        sandbox="allow-scripts allow-same-origin"
      />
    );
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex gap-2">
        <Input
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe the component you want to generate (e.g., 'A login form with email and password fields')"
          disabled={isGenerating}
          className="flex-grow"
        />
        <Button 
          onClick={handleGenerateCode} 
          disabled={isGenerating || !prompt.trim()}
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : 'Generate Code'}
        </Button>
      </div>
      
      {generatedCode && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Generated Code</CardTitle>
            <div className="flex border-b">
              <Button
                variant={activeTab === 'html' ? 'default' : 'ghost'}
                className="rounded-none"
                onClick={() => setActiveTab('html')}
              >
                HTML
              </Button>
              <Button
                variant={activeTab === 'css' ? 'default' : 'ghost'}
                className="rounded-none"
                onClick={() => setActiveTab('css')}
              >
                CSS
              </Button>
              <Button
                variant={activeTab === 'js' ? 'default' : 'ghost'}
                className="rounded-none"
                onClick={() => setActiveTab('js')}
              >
                JavaScript
              </Button>
              <Button
                variant={activeTab === 'preview' ? 'default' : 'ghost'}
                className="rounded-none"
                onClick={() => setActiveTab('preview')}
              >
                Preview
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {activeTab === 'preview' ? (
              renderPreview()
            ) : (
              <pre className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg overflow-x-auto max-h-[500px]">
                <code>{generatedCode[activeTab]}</code>
              </pre>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CodeGenerator;
