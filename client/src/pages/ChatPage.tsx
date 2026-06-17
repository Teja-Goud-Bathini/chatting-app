import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { LogOut, MessageCircle } from 'lucide-react';
import { ChatWindow } from '../components/chatWindow';
import { useAuthStore } from '../store/auth.store';
import { disconnectSocket } from '../services/socket';

const demoConversations = [
  { id: 'general', name: 'General', preview: 'Start chatting with the team' },
  { id: 'support', name: 'Support', preview: 'Questions and follow-ups' },
];

export function ChatPage() {
  const { conversationId } = useParams();
  const { user, fetchMe, logout } = useAuthStore();
  const activeConversationId = conversationId || demoConversations[0].id;

  useEffect(() => {
    if (!user) {
      void fetchMe();
    }
  }, [fetchMe, user]);

  const handleLogout = () => {
    disconnectSocket();
    logout();
  };

  return (
    <main className='h-screen bg-[#d1d7db] text-left'>
      <div className='mx-auto flex h-full max-w-6xl overflow-hidden bg-white shadow-lg'>
        <aside className='w-80 shrink-0 border-r border-slate-200 bg-white'>
          <header className='flex h-16 items-center justify-between bg-[#f0f2f5] px-4'>
            <div className='flex items-center gap-3 min-w-0'>
              {user?.avatar ? (
                <img src={user.avatar} alt='' className='h-10 w-10 rounded-full object-cover' />
              ) : (
                <div className='flex h-10 w-10 items-center justify-center rounded-full bg-[#00a884] text-white'>
                  <MessageCircle size={20} />
                </div>
              )}
              <div className='min-w-0'>
                <p className='truncate text-sm font-semibold text-slate-900'>{user?.name || 'Chat'}</p>
                <p className='truncate text-xs text-slate-500'>{user?.email || 'Signed in'}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className='flex h-9 w-9 items-center justify-center rounded-full text-slate-600 hover:bg-slate-200'
              aria-label='Log out'
              title='Log out'
            >
              <LogOut size={18} />
            </button>
          </header>

          <nav className='divide-y divide-slate-100'>
            {demoConversations.map((conversation) => (
              <Link
                key={conversation.id}
                to={`/c/${conversation.id}`}
                className={`block px-4 py-3 hover:bg-slate-50 ${
                  activeConversationId === conversation.id ? 'bg-[#f0f2f5]' : ''
                }`}
              >
                <p className='text-sm font-medium text-slate-900'>{conversation.name}</p>
                <p className='text-xs text-slate-500'>{conversation.preview}</p>
              </Link>
            ))}
          </nav>
        </aside>

        <section className='min-w-0 flex-1'>
          <ChatWindow conversationId={activeConversationId} />
        </section>
      </div>
    </main>
  );
}
