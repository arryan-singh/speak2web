
// Speech recognition utility functions

// Check if browser supports speech recognition
export const isSpeechRecognitionSupported = (): boolean => {
  return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
};

// Wake word detection with configurable sensitivity
export class WakeWordDetector {
  private recognition: any = null;
  private wakeWord: string;
  private onWakeWordDetected: () => void;
  private isListening: boolean = false;
  private restartTimeout: number | null = null;
  
  constructor(wakeWord: string, onWakeWordDetected: () => void) {
    this.wakeWord = wakeWord.toLowerCase();
    this.onWakeWordDetected = onWakeWordDetected;
    
    if (isSpeechRecognitionSupported()) {
      // Use any type to avoid TypeScript errors with the Speech Recognition API
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';
      
      this.recognition.onresult = this.handleSpeechResult.bind(this);
      this.recognition.onerror = this.handleSpeechError.bind(this);
      this.recognition.onend = this.handleSpeechEnd.bind(this);
    }
  }
  
  private handleSpeechResult(event: SpeechRecognitionEvent) {
    const current = event.resultIndex;
    const transcript = event.results[current][0].transcript.toLowerCase().trim();
    console.log('Heard:', transcript);
    
    // Check if wake word is detected
    if (transcript.includes(this.wakeWord)) {
      console.log('Wake word detected:', this.wakeWord);
      // Temporarily stop listening to avoid multiple detections
      this.pause();
      
      // Trigger the callback
      this.onWakeWordDetected();
      
      // Restart listening after a short delay
      this.restartTimeout = window.setTimeout(() => {
        this.start();
      }, 5000); // Resume listening after 5 seconds
    }
  }
  
  private handleSpeechError(event: SpeechRecognitionErrorEvent) {
    console.error('Speech recognition error:', event.error, event.message);
    
    // Restart on error after a short delay
    if (this.isListening) {
      this.restartTimeout = window.setTimeout(() => {
        this.start();
      }, 1000);
    }
  }
  
  private handleSpeechEnd() {
    // Restart if should still be listening
    if (this.isListening && this.recognition) {
      console.log('Speech recognition ended, restarting...');
      this.recognition.start();
    }
  }
  
  public start() {
    if (this.recognition) {
      try {
        this.recognition.start();
        this.isListening = true;
        console.log('Wake word detection started, listening for:', this.wakeWord);
      } catch (error) {
        console.error('Error starting speech recognition:', error);
      }
    } else {
      console.error('Speech recognition not supported');
    }
  }
  
  public pause() {
    if (this.recognition) {
      this.recognition.stop();
      this.isListening = false;
      
      if (this.restartTimeout) {
        clearTimeout(this.restartTimeout);
        this.restartTimeout = null;
      }
    }
  }
  
  public stop() {
    this.pause();
    this.isListening = false;
  }
  
  public isActive(): boolean {
    return this.isListening;
  }
}
