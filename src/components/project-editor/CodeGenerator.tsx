import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { Loader2, MessageSquare, Edit, Save } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar } from "@/components/ui/avatar";
import InputArea from './InputArea';

interface GeneratedCode {
  html: string;
  css: string;
  js: string;
}

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  code?: GeneratedCode;
}

// Reduced sample prompts from 4 to 2
const SAMPLE_PROMPTS = [
  "Create a contact form with name, email, message, and a submit button.",
  "Design a responsive navigation menu with dropdown support."
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
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Scroll to bottom of chat when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const handleGenerateCode = async () => {
    if (prompt.trim() === '') {
      toast({
        title: "Empty Prompt",
        description: "Please enter a description of the code you want to generate.",
        variant: "destructive"
      });
      return;
    }
    
    // Add user message to chat
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: prompt,
      timestamp: new Date(),
    };
    setChatHistory(prev => [...prev, userMessage]);
    
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
      const generatedCodeData = data as GeneratedCode;
      setGeneratedCode(generatedCodeData);
      
      // Add assistant message with code to chat
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: 'Here is the generated code:',
        timestamp: new Date(),
        code: generatedCodeData
      };
      setChatHistory(prev => [...prev, assistantMessage]);
      
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
      
      // Add error message to chat
      const assistantErrorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: `Error: ${errorMessage}`,
        timestamp: new Date(),
      };
      setChatHistory(prev => [...prev, assistantErrorMessage]);
      
      toast({
        title: "Error Generating Code",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
      setPrompt(''); // Clear input after sending
    }
  };

  const handleSamplePrompt = (samplePrompt: string) => {
    setPrompt(samplePrompt);
  };

  const toggleListening = () => {
    setIsListening(!isListening);
    
    // Show toast for voice recognition state
    if (!isListening) {
      toast({
        title: "Voice Recognition Activated",
        description: "Speak naturally to create your prompt."
      });
    } else {
      toast({
        title: "Voice Recognition Paused",
        description: "Voice input has been disabled."
      });
    }
  };

  const saveToHistory = async (messageId: string) => {
    const messageWithCode = chatHistory.find(msg => msg.id === messageId && msg.code);
    if (!messageWithCode?.code) return;
    
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
          generatedCode: messageWithCode.code
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

  const handleModifyCode = (messageId: string) => {
    const messageToModify = chatHistory.find(msg => msg.id === messageId);
    if (messageToModify?.code) {
      setPrompt(`Please modify this code to: `);
      toast({
        title: "Edit Mode",
        description: "Please describe how you'd like to modify the code."
      });
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8.5rem)] overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <Card className="h-full">
          <div className="h-full overflow-hidden flex flex-col">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-medium">Code Generator</h3>
              <Button
                size="sm"
                variant={isListening ? "destructive" : "outline"}
                className="flex items-center gap-2 dark:border-gray-500 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
              >
                {isListening ? "Disable Voice Input" : "Enable Voice Input"}
              </Button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              {chatHistory.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-6 text-gray-500">
                  <MessageSquare className="h-12 w-12 mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">No conversations yet</h3>
                  <p className="text-sm mb-4">Start by typing a prompt below, try one of the sample prompts, or enable voice input.</p>
                </div>
              ) : (
                <div className="space-y-4 pb-4">
                  {chatHistory.map((message) => (
                    <div 
                      key={message.id}
                      className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`flex gap-3 max-w-[80%] ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                        <Avatar className={`h-8 w-8 ${message.type === 'user' ? 'bg-primary text-white' : 'bg-gray-200 dark:bg-gray-600'}`}>
                          <span className="text-xs">{message.type === 'user' ? 'U' : 'AI'}</span>
                        </Avatar>
                        <div className="w-full">
                          <div 
                            className={`rounded-lg p-3 text-sm ${
                              message.type === 'user' 
                                ? 'bg-primary text-primary-foreground dark:bg-blue-600 dark:text-white' 
                                : 'bg-muted dark:bg-gray-700 dark:text-white dark:border dark:border-gray-600'
                            }`}
                          >
                            {message.content}
                          </div>
                          
                          {message.code && (
                            <div className="mt-2">
                              <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="w-full">
                                <TabsList className="grid grid-cols-3 dark:bg-gray-700 dark:text-white">
                                  <TabsTrigger value="html" className="dark:data-[state=active]:bg-blue-600 dark:data-[state=active]:text-white dark:text-gray-200">HTML</TabsTrigger>
                                  <TabsTrigger value="css" className="dark:data-[state=active]:bg-blue-600 dark:data-[state=active]:text-white dark:text-gray-200">CSS</TabsTrigger>
                                  <TabsTrigger value="js" className="dark:data-[state=active]:bg-blue-600 dark:data-[state=active]:text-white dark:text-gray-200">JavaScript</TabsTrigger>
                                </TabsList>
                                <TabsContent value="html">
                                  <pre className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg overflow-x-auto text-xs max-h-[300px] overflow-y-auto border dark:border-gray-700">
                                    <code className="text-gray-800 dark:text-gray-200">{message.code.html}</code>
                                  </pre>
                                </TabsContent>
                                <TabsContent value="css">
                                  <pre className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg overflow-x-auto text-xs max-h-[300px] overflow-y-auto border dark:border-gray-700">
                                    <code className="text-gray-800 dark:text-gray-200">{message.code.css}</code>
                                  </pre>
                                </TabsContent>
                                <TabsContent value="js">
                                  <pre className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg overflow-x-auto text-xs max-h-[300px] overflow-y-auto border dark:border-gray-700">
                                    <code className="text-gray-800 dark:text-gray-200">{message.code.js}</code>
                                  </pre>
                                </TabsContent>
                              </Tabs>
                              
                              <div className="flex gap-2 mt-2 justify-end">
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => saveToHistory(message.id)}
                                  title="Save to chat history"
                                  className="dark:bg-gray-700 dark:text-white dark:border-gray-500 dark:hover:bg-gray-600"
                                >
                                  <Save className="h-4 w-4 mr-1" />
                                  <span className="text-xs">Save</span>
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => handleModifyCode(message.id)}
                                  title="Modify code"
                                  className="dark:bg-gray-700 dark:text-white dark:border-gray-500 dark:hover:bg-gray-600"
                                >
                                  <Edit className="h-4 w-4 mr-1" />
                                  <span className="text-xs">Edit</span>
                                </Button>
                              </div>
                              
                              {message.id === chatHistory[chatHistory.length - 1].id && showModificationPrompt && (
                                <Alert className="bg-primary/5 border-primary/20 mt-2 dark:bg-blue-900/30 dark:border-blue-500/30">
                                  <AlertTitle className="flex items-center gap-2 dark:text-white">
                                    <MessageSquare className="h-4 w-4" />
                                    Would you like to modify this code?
                                  </AlertTitle>
                                  <AlertDescription className="mt-2 flex gap-2">
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      onClick={() => handleModifyCode(message.id)}
                                      className="dark:bg-gray-700 dark:text-white dark:border-gray-500 dark:hover:bg-gray-600"
                                    >
                                      Yes, make changes
                                    </Button>
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      onClick={() => setShowModificationPrompt(false)}
                                      className="dark:text-gray-200 dark:hover:bg-gray-700"
                                    >
                                      No, keep as is
                                    </Button>
                                  </AlertDescription>
                                </Alert>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>
            
            {errorDetails && !chatHistory.some(msg => msg.content.includes(errorDetails)) && (
              <CardContent className="pt-0">
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
              </CardContent>
            )}
            
            <div className="border-t py-2 px-4 bg-white dark:bg-gray-900">
              <div className="flex flex-wrap gap-2 items-center">
                <span className="text-xs font-medium dark:text-gray-300">Try:</span>
                {SAMPLE_PROMPTS.map((samplePrompt, index) => (
                  <Button 
                    key={index} 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleSamplePrompt(samplePrompt)}
                    className="text-xs dark:text-white dark:bg-gray-700 dark:hover:bg-gray-600 dark:border-gray-500"
                  >
                    {samplePrompt.length > 35 ? samplePrompt.substring(0, 35) + '...' : samplePrompt}
                  </Button>
                ))}
              </div>
              
              <InputArea
                inputValue={prompt}
                setInputValue={setPrompt}
                isListening={isListening}
                toggleListening={toggleListening}
                handleSend={handleGenerateCode}
                isProcessing={isGenerating}
              />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default CodeGenerator;
