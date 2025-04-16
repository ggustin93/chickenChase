import React from 'react';
import ChatMessageList from '../ChatMessageList';
import { Message } from '../../data/types';

interface ChatTabProps {
  messages: Message[];
}

const ChatTab: React.FC<ChatTabProps> = ({ messages }) => {
  return (
    <>
      {/* Use the updated ChatMessageList component - no need for currentTeamName anymore */}
      <ChatMessageList messages={messages} />
      
      {/* No input footer since we're only showing notifications and clues */}
    </>
  );
};

export default ChatTab; 