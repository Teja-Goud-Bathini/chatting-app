import { useEffect } from 'react';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSocket } from '../services/socket';
import { api } from '../services/api';

export function useChat(conversationId: string) {
  const queryClient = useQueryClient();
  const socket = getSocket();

  // ─── Fetch paginated message history ───────────────────────
  const messagesQuery = useInfiniteQuery({
    queryKey: ['messages', conversationId],
    queryFn: ({ pageParam }) =>
      api.get(`/api/messages/${conversationId}`, {
        params: { cursor: pageParam }
      }).then(r => r.data),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: undefined,
  });

  // ─── Send a message ─────────────────────────────────────────
  const sendMessage = useMutation({
    mutationFn: (data: { content: string; type?: string }) =>
      api.post('/api/messages', { ...data, conversationId }).then(r => r.data),
    onMutate: async (variables) => {
      const tempMessage = {
        id: `temp-${Date.now()}`,
        content: variables.content,
        createdAt: new Date().toISOString(),
        sender: queryClient.getQueryData(['me']),
        status: 'sending',
      };
      queryClient.setQueryData(['messages', conversationId], (old: any) => ({
        ...old,
        pages: old.pages.map((p: any, i: number) =>
          i === old.pages.length - 1
            ? { ...p, messages: [...p.messages, tempMessage] }
            : p
        )
      }));
    }
  });

  // ─── Subscribe to real-time events ─────────────────────────
  useEffect(() => {
    socket.on('new_message', (message) => {
      if (message.conversationId !== conversationId) return;
      queryClient.setQueryData(['messages', conversationId], (old: any) => ({
        ...old,
        pages: old.pages.map((p: any, i: number) =>
          i === old.pages.length - 1
            ? { ...p, messages: p.messages.filter((m: any) => !m.id.startsWith('temp-')).concat(message) }
            : p
        )
      }));
    });

    socket.emit('mark_read', { conversationId });

    return () => { socket.off('new_message'); };
  }, [conversationId]);

  return { messagesQuery, sendMessage };
}
