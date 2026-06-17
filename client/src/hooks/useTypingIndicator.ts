import { useState, useEffect, useRef } from 'react';
import { getSocket } from '../services/socket';

export function useTypingIndicator(conversationId: string) {
  const socket = getSocket();
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const stopTypingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onKeyPress = () => {
    socket.emit('typing_start', { conversationId });
    if (stopTypingTimer.current) {
      clearTimeout(stopTypingTimer.current);
    }
    stopTypingTimer.current = setTimeout(() => {
      socket.emit('typing_stop', { conversationId });
    }, 2000);
  };

  useEffect(() => {
    socket.on('user_typing', ({ name, isTyping }) => {
      setTypingUsers(prev =>
        isTyping ? [...new Set([...prev, name])] : prev.filter(n => n !== name)
      );
    });
    return () => { socket.off('user_typing'); };
  }, [conversationId]);

  return { typingUsers, onKeyPress };
}
