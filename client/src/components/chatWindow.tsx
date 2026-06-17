import { useRef, useEffect, useState } from 'react';
import { useChat } from '../hooks/useChat';
import { useTypingIndicator } from '../hooks/useTypingIndicator';
import { MessageBubble } from './MessageBubble';
import { useAuthStore } from '../store/auth.store';
import { Send } from 'lucide-react';

export function ChatWindow({ conversationId }: { conversationId: string }) {
  const { user } = useAuthStore();
  const { messagesQuery, sendMessage } = useChat(conversationId);
  const { typingUsers, onKeyPress } = useTypingIndicator(conversationId);
  const [draft, setDraft] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messagesQuery.data?.pages]);

  const allMessages = messagesQuery.data?.pages.flatMap(p => p.messages) ?? [];

  const handleSend = () => {
    if (!draft.trim()) return;
    sendMessage.mutate({ content: draft });
    setDraft('');
  };

  return (
    <div className='flex flex-col h-full bg-[#ECE5DD]'>
      {messagesQuery.hasNextPage && (
        <button onClick={() => messagesQuery.fetchNextPage()}
          className='text-xs text-center py-2 text-gray-500 hover:text-gray-700'>
          Load older messages
        </button>
      )}

      <div className='flex-1 overflow-y-auto p-4 space-y-2'>
        {allMessages.map(msg => (
          <MessageBubble key={msg.id} message={msg} isMine={msg.sender.id === user?.id} />
        ))}
        {typingUsers.length > 0 && (
          <div className='text-xs text-gray-500 italic pl-2'>
            {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className='flex items-center gap-2 p-3 bg-[#F0F2F5]'>
        <input
          value={draft}
          onChange={e => {
            setDraft(e.target.value);
            onKeyPress();
          }}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
          placeholder='Type a message'
          className='flex-1 rounded-full px-4 py-2 bg-white outline-none text-sm'
        />
        <button onClick={handleSend}
          className='w-10 h-10 flex items-center justify-center bg-primary rounded-full text-white'>
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}
