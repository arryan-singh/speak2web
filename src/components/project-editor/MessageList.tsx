
import React from "react";
import type { Message } from "./ChatInterface";
import { User, Bot } from "lucide-react";

interface MessageListProps {
  messages: Message[];
  messagesEndRef: React.RefObject<HTMLDivElement>;
}

const MessageList: React.FC<MessageListProps> = ({ messages, messagesEndRef }) => {
  return (
    <div className="flex-grow overflow-y-auto p-4 mb-2 bg-gray-50 dark:bg-gray-800/50">
      <div className="space-y-4">
        {messages.map((message, index) => (
          <div 
            key={index} 
            className={`flex items-start gap-3 ${
              message.type === 'user' 
                ? 'ml-auto flex-row-reverse' 
                : ''
            }`}
          >
            {/* Avatar/Logo for the message */}
            <div className={`flex-shrink-0 rounded-full w-8 h-8 flex items-center justify-center text-sm font-medium ${
              message.type === 'user' 
                ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-200' 
                : 'bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-200'
            }`}>
              {message.type === 'user' ? (
                <User className="h-5 w-5" />
              ) : (
                <div className="font-semibold text-xs">S2W</div>
              )}
            </div>
            
            {/* Message content */}
            <div 
              className={`${
                message.type === 'user' 
                  ? 'bg-blue-600 text-white dark:bg-blue-600 dark:border-blue-500 dark:text-white' 
                  : 'bg-white text-gray-800 border border-gray-200 dark:bg-gray-700 dark:text-white dark:border-gray-600'
              } p-4 rounded-xl max-w-[85%] shadow-sm animate-fade-in ring-1 ring-inset ${
                message.type === 'user'
                  ? 'ring-blue-700 dark:ring-blue-400'
                  : 'ring-gray-200 dark:ring-gray-600'
              }`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {message.isProcessing ? (
                <div className="flex items-center gap-2 p-1">
                  <div className="w-2 h-2 bg-gray-300 dark:bg-gray-300 rounded-full animate-pulse"></div>
                  <div className="w-2 h-2 bg-gray-300 dark:bg-gray-300 rounded-full animate-pulse" style={{ animationDelay: "0.2s" }}></div>
                  <div className="w-2 h-2 bg-gray-300 dark:bg-gray-300 rounded-full animate-pulse" style={{ animationDelay: "0.4s" }}></div>
                </div>
              ) : (
                <p className="whitespace-pre-wrap break-words">{message.content}</p>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default MessageList;
