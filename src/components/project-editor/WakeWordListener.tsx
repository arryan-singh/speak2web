
import React, { useEffect, useState, useRef } from 'react';
import { WakeWordDetector, isSpeechRecognitionSupported } from '@/utils/speechRecognition';
import { toast } from '@/components/ui/use-toast';
import { Mic, MicOff, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WakeWordListenerProps {
  wakeWord: string;
  onWakeWordDetected: () => void;
  isDisabled?: boolean;
}

const WakeWordListener: React.FC<WakeWordListenerProps> = ({
  wakeWord,
  onWakeWordDetected,
  isDisabled = false
}) => {
  const [isListening, setIsListening] = useState(false);
  const detectorRef = useRef<WakeWordDetector | null>(null);
  const [isSupported, setIsSupported] = useState(true);

  useEffect(() => {
    const isSupported = isSpeechRecognitionSupported();
    setIsSupported(isSupported);
    
    if (isSupported) {
      detectorRef.current = new WakeWordDetector(wakeWord, () => {
        toast({
          title: "Wake Word Detected",
          description: `"${wakeWord}" detected! Listening for your command...`,
        });
        onWakeWordDetected();
      });
    }
    
    return () => {
      if (detectorRef.current) {
        detectorRef.current.stop();
      }
    };
  }, [wakeWord, onWakeWordDetected]);
  
  const toggleListening = () => {
    if (!detectorRef.current) return;
    
    if (isListening) {
      detectorRef.current.stop();
      setIsListening(false);
      toast({
        title: "Wake Word Detection Disabled",
        description: "No longer listening for the wake word."
      });
    } else {
      try {
        detectorRef.current.start();
        setIsListening(true);
        toast({
          title: "Wake Word Detection Enabled",
          description: `Listening for "${wakeWord}"...`
        });
      } catch (error) {
        console.error("Error starting wake word detection:", error);
        toast({
          title: "Error",
          description: "Could not start speech recognition. Please ensure microphone permissions are granted.",
          variant: "destructive"
        });
      }
    }
  };
  
  useEffect(() => {
    if (isDisabled && isListening && detectorRef.current) {
      detectorRef.current.stop();
      setIsListening(false);
    }
  }, [isDisabled, isListening]);

  if (!isSupported) {
    return (
      <div className="flex items-center gap-2 text-amber-500">
        <AlertCircle size={16} />
        <span className="text-xs">Speech recognition not supported in this browser</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        variant={isListening ? "destructive" : "outline"}
        className={`flex items-center gap-2 ${isListening ? 'bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700' : ''}`}
        onClick={toggleListening}
        disabled={isDisabled}
      >
        {isListening ? (
          <>
            <MicOff size={16} /> Wake Word Active
          </>
        ) : (
          <>
            <Mic size={16} /> Enable Wake Word
          </>
        )}
      </Button>
      {isListening && (
        <span className="text-xs text-muted-foreground">Listening for "{wakeWord}"</span>
      )}
    </div>
  );
};

export default WakeWordListener;
