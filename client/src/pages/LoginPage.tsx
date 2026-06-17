import { MessageCircle } from 'lucide-react';

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export function LoginPage() {
  return (
    <main className='min-h-screen bg-[#f0f2f5] flex items-center justify-center px-4'>
      <section className='w-full max-w-sm bg-white border border-slate-200 rounded-lg shadow-sm p-6 text-center'>
        <div className='mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#00a884] text-white'>
          <MessageCircle size={26} />
        </div>
        <h1 className='text-2xl font-semibold text-slate-900 mb-2'>WhatsApp Clone</h1>
        <p className='text-sm text-slate-500 mb-6'>
          Sign in with Google to continue to your chats.
        </p>
        <a
          href={`${apiUrl}/auth/google`}
          className='inline-flex w-full items-center justify-center rounded-md bg-[#00a884] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#029673]'
        >
          Continue with Google
        </a>
      </section>
    </main>
  );
}
