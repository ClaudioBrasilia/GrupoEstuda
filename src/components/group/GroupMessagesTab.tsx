
import React from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Message } from '@/types/groupTypes';
import { useTranslation } from 'react-i18next';

interface GroupMessagesTabProps {
  messages: Message[];
  messageText: string;
  setMessageText: (value: string) => void;
  handleSendMessage: (e: React.FormEvent) => void;
  currentUserId?: string;
}

const GroupMessagesTab: React.FC<GroupMessagesTabProps> = ({
  messages,
  messageText,
  setMessageText,
  handleSendMessage,
  currentUserId = ''
}) => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col h-[calc(100vh-280px)]">
      <h3 className="font-semibold mb-4">{t('groupMessages.messageHistory')}</h3>
      
      <ScrollArea className="flex-1 mb-4 border rounded-md p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div 
              key={message.id}
              className={`flex ${message.userId === currentUserId ? 'justify-end' : 'justify-start'}`}
            >
              <div 
                className={`
                  max-w-[80%] rounded-lg px-4 py-2
                  ${message.userId === currentUserId 
                    ? 'bg-study-primary text-white' 
                    : 'bg-gray-100 text-gray-800'}
                `}
              >
                {message.userId !== currentUserId && (
                  <p className="text-xs font-semibold mb-1">{message.userName}</p>
                )}
                <p>{message.text}</p>
                <p className="text-xs text-right mt-1 opacity-70">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
      
      <form onSubmit={handleSendMessage} className="flex space-x-2">
        <Input
          placeholder={t('groupMessages.placeholder')}
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          className="flex-1"
        />
        <Button type="submit" className="bg-study-primary">
          <Send size={18} />
          <span className="ml-2 hidden sm:inline">{t('groupMessages.send')}</span>
        </Button>
      </form>
    </div>
  );
};

export default GroupMessagesTab;
