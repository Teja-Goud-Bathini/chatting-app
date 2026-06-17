import { CheckCheck, Check } from 'lucide-react';

function StatusIcon({ status }: { status: string }) {
  if (status === 'read') return <CheckCheck size={14} className='text-blue-500' />;
  if (status === 'delivered') return <CheckCheck size={14} className='text-gray-400' />;
  return <Check size={14} className='text-gray-400' />;
}

export function MessageBubble({ message, isMine }: { message: any; isMine: boolean }) {
  const sentAt = new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(message.createdAt));

  return (
    <div className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[70%] rounded-lg px-3 py-2 shadow-sm
        ${isMine ? 'bg-[#D9FDD3] rounded-tr-none' : 'bg-white rounded-tl-none'}`}>
        {!isMine && (
          <p className='text-xs font-semibold text-primary mb-1'>{message.sender.name}</p>
        )}
        <p className='text-sm text-gray-800 whitespace-pre-wrap'>{message.content}</p>
        <div className='flex items-center justify-end gap-1 mt-1'>
          <span className='text-[10px] text-gray-400'>
            {sentAt}
          </span>
          {isMine && <StatusIcon status={message.status || 'sent'} />}
        </div>
      </div>
    </div>
  );
}
