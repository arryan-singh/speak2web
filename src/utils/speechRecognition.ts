
// Speech recognition utility functions

// Check if browser supports speech recognition
export const isSpeechRecognitionSupported = (): boolean => {
  return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
};

// Continuous voice recognition class
export class ContinuousVoiceRecognition {
  private recognition: any = null;
  private onTranscriptUpdate: (transcript: string) => void;
  private isListening: boolean = false;
  private restartTimeout: number | null = null;
  private finalTranscript: string = '';
  
  constructor(onTranscriptUpdate: (transcript: string) => void) {
    this.onTranscriptUpdate = onTranscriptUpdate;
    
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
    let interimTranscript = '';
    
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        this.finalTranscript += transcript + ' ';
      } else {
        interimTranscript = transcript;
      }
    }
    
    // Send the complete transcript (final + interim) to callback
    this.onTranscriptUpdate(this.finalTranscript + interimTranscript);
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
        console.log('Continuous voice recognition started');
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
    this.finalTranscript = '';
  }
  
  public isActive(): boolean {
    return this.isListening;
  }
  
  public clearTranscript() {
    this.finalTranscript = '';
  }
}

