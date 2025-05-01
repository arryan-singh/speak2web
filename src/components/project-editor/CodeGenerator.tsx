
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import { Loader2, Save, MessageSquare, Edit } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface GeneratedCode {
  html: string;
  css: string;
  js: string;
}

// Sample prompts for user guidance
const SAMPLE_PROMPTS = [
  "Create a contact form with name, email, message, and a submit button.",
  "I want a portfolio section with image and description cards.",
  "Design a responsive navigation menu with dropdown support.",
  "Build a product pricing table with three tiers and feature lists."
];

const CodeGenerator = () => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<GeneratedCode | null>(null);
  const [activeTab, setActiveTab] = useState<'html' | 'css' | 'js'>('html');
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const [rawResponsePreview, setRawResponsePreview] = useState<string | null>(null);
  const [showModificationPrompt, setShowModificationPrompt] = useState(false);
  
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
    setErrorDetails(null);
    setErrorStatus(null);
    setRawResponsePreview(null);
    setShowModificationPrompt(false);
    
    try {
      // Call the AI service edge function for code generation
      const { data, error } = await supabase.functions.invoke('ai-service', {
        body: {
          action: 'generateCode',
          prompt: prompt
        }
      });
      
      if (error) {
        console.error("Supabase Function Error:", error);
        throw new Error(error.message || 'Error calling AI service');
      }
      
      if (data.error) {
        console.error("AI Service Error:", data.error, data.details);
        setErrorStatus(data.status || null);
        // Store raw response preview if available
        if (data.rawResponsePreview) {
          setRawResponsePreview(data.rawResponsePreview);
        }
        throw new Error(data.error + (data.details ? `: ${data.details}` : ''));
      }
      
      // Set the generated code
      setGeneratedCode(data as GeneratedCode);
      // Show modification prompt after successful generation
      setShowModificationPrompt(true);
      
      // Emit an event to update the project preview
      const previewEvent = new CustomEvent('updateProjectPreview', { 
        detail: data 
      });
      window.dispatchEvent(previewEvent);
      
      toast({
        title: "Code Generated",
        description: "Your code has been successfully generated!"
      });
    } catch (error) {
      console.error("Code Generation Error:", error);
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
      setErrorDetails(errorMessage);
      toast({
        title: "Error Generating Code",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSamplePrompt = (samplePrompt: string) => {
    setPrompt(samplePrompt);
  };

  const saveToHistory = async () => {
    if (!generatedCode) return;
    
    try {
      // Format code as a chat message
      const codeMessage = {
        action: 'generateChat',
        messages: [{
          type: 'user',
          content: `Generated Code for prompt: "${prompt}"`
        }]
      };
      
      // Save to chat history
      const { error } = await supabase.functions.invoke('ai-service', {
        body: {
          ...codeMessage,
          saveToHistory: true,
          generatedCode: generatedCode
        }
      });
      
      if (error) {
        throw new Error(error.message || 'Error saving to chat history');
      }
      
      toast({
        title: "Saved to History",
        description: "Generated code has been saved to your chat history."
      });
    } catch (error) {
      console.error("Error saving to chat history:", error);
      toast({
        title: "Error",
        description: "Failed to save code to chat history.",
        variant: "destructive"
      });
    }
  };

  const handleModifyCode = () => {
    // Navigate to chat interface with the generated code context
    toast({
      title: "Edit Mode",
      description: "Please describe how you'd like to modify the code."
    });
    
    // In a real implementation, this would redirect to chat with context
    // or open a dialog to collect modification details
  };

  return (
    <div className="flex flex-col gap-4 p-4 overflow-y-auto h-full">
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <CardTitle>Generate UI Components with AI</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Describe the UI component you want to create, and the AI will generate HTML, CSS, and JavaScript code for you.
          </p>
          
          <div className="flex gap-2 mb-4">
            <Input
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the component you want to generate..."
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
          
          {errorDetails && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                {errorStatus === 'missing_api_key' ? (
                  <>
                    The Gemini API key is missing or not properly configured. Please contact the administrator to set up the API key.
                  </>
                ) : errorStatus === 'parse_error' ? (
                  <>
                    <p>The AI model returned a response that could not be parsed as JSON. The model may need additional training to return the correct format.</p>
                    {rawResponsePreview && (
                      <div className="mt-2">
                        <p className="font-semibold">Raw response preview:</p>
                        <pre className="mt-1 text-xs p-2 bg-gray-800 text-white overflow-x-auto rounded">
                          {rawResponsePreview}
                        </pre>
                      </div>
                    )}
                  </>
                ) : (
                  errorDetails
                )}
              </AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-2">
            <p className="text-sm font-medium">Try these sample prompts:</p>
            <div className="flex flex-wrap gap-2">
              {SAMPLE_PROMPTS.map((samplePrompt, index) => (
                <Button 
                  key={index} 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleSamplePrompt(samplePrompt)}
                  className="text-xs"
                >
                  {samplePrompt.length > 40 ? samplePrompt.substring(0, 40) + '...' : samplePrompt}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
      
      {generatedCode && (
        <Card className="mb-4">
          <CardHeader className="pb-3">
            <CardTitle className="flex justify-between items-center">
              <span>Generated Code</span>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={saveToHistory}
                  title="Save to chat history"
                >
                  <Save className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">Save</span>
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleModifyCode}
                  title="Modify code"
                >
                  <Edit className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">Edit</span>
                </Button>
              </div>
            </CardTitle>
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
              <TabsList className="grid grid-cols-3">
                <TabsTrigger value="html">HTML</TabsTrigger>
                <TabsTrigger value="css">CSS</TabsTrigger>
                <TabsTrigger value="js">JavaScript</TabsTrigger>
              </TabsList>
              <TabsContent value="html">
                <pre className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg overflow-x-auto max-h-[500px]">
                  <code>{generatedCode.html}</code>
                </pre>
              </TabsContent>
              <TabsContent value="css">
                <pre className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg overflow-x-auto max-h-[500px]">
                  <code>{generatedCode.css}</code>
                </pre>
              </TabsContent>
              <TabsContent value="js">
                <pre className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg overflow-x-auto max-h-[500px]">
                  <code>{generatedCode.js}</code>
                </pre>
              </TabsContent>
            </Tabs>
          </CardHeader>
          {showModificationPrompt && (
            <CardContent className="pb-2">
              <Alert className="bg-primary/5 border-primary/20">
                <AlertTitle className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Would you like to modify this code?
                </AlertTitle>
                <AlertDescription className="mt-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleModifyCode}
                    className="mr-2"
                  >
                    Yes, make changes
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setShowModificationPrompt(false)}
                  >
                    No, keep as is
                  </Button>
                </AlertDescription>
              </Alert>
            </CardContent>
          )}
        </Card>
      )}
    </div>
  );
};

export default CodeGenerator;
