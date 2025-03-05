
import React from "react";
import type { Message } from "./ChatInterface";

interface MessageListProps {
  messages: Message[];
  messagesEndRef: React.RefObject<HTMLDivElement>;
}

const MessageList: React.FC<MessageListProps> = ({ messages, messagesEndRef }) => {
  return (
    <div className="flex-grow overflow-y-auto p-4 mb-2 bg-background-darker dark:bg-gray-800">
      <div className="space-y-4">
        {messages.map((message, index) => (
          <div 
            key={index} 
            className={`${
              message.type === 'user' 
                ? 'ml-auto bg-primary text-white dark:bg-blue-600' 
                : 'bg-white text-primary border border-gray-200 dark:bg-gray-700 dark:text-white dark:border-gray-600'
            } p-4 rounded-xl max-w-[85%] shadow-sm animate-fade-in`}
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            {message.isProcessing ? (
              <div className="flex items-center gap-2 p-1">
                <div className="w-2 h-2 bg-gray-400 dark:bg-gray-300 rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-gray-400 dark:bg-gray-300 rounded-full animate-pulse" style={{ animationDelay: "0.2s" }}></div>
                <div className="w-2 h-2 bg-gray-400 dark:bg-gray-300 rounded-full animate-pulse" style={{ animationDelay: "0.4s" }}></div>
              </div>
            ) : (
              <p className="whitespace-pre-wrap break-words">{message.content}</p>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default MessageList;
