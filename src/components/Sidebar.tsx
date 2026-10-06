import { useMemo, useState, type FormEvent } from 'react';
import { lastActivity } from '../store/chats';
import type { Chat } from '../types';
import { Avatar } from './Avatar';
import { formatListTime } from './time';
import type { PollingState } from '../hooks/useNotificationPolling';

interface SidebarProps {
  chats: Chat[];
  activeChatId: string | null;
  idInstance: string;
  pollingState: PollingState;
  onOpenChat: (chatId: string) => void;
  onCreateChat: (phone: string, name: string) => Promise<void>;
  onLogout: () => void;
}

const STATUS_LABEL: Record<PollingState, string> = {
  connecting: 'Connecting…',
  online: 'Online',
  error: 'Reconnecting…',
};

export function Sidebar({
  chats,
  activeChatId,
  idInstance,
  pollingState,
  onOpenChat,
  onCreateChat,
  onLogout,
}: SidebarProps) {
  const [query, setQuery] = useState('');
  const [creating, setCreating] = useState(false);

  const visibleChats = useMemo(() => {
    const q = query.trim().toLowerCase();
    const digits = q.replace(/\D/g, '');
    return [...chats]
      .filter((c) => !q || c.name.toLowerCase().includes(q) || (digits !== '' && c.phone.includes(digits)))
      .sort((a, b) => lastActivity(b) - lastActivity(a));
  }, [chats, query]);

  return (
    <aside className="sidebar">
      <header className="sidebar-header">
        <div className="sidebar-title">
          <h2>Chats</h2>
          <span className={`connection connection-${pollingState}`}>
            <i /> {STATUS_LABEL[pollingState]} · {idInstance}
          </span>
        </div>
        <button className="icon-button" title="New chat" aria-label="New chat" onClick={() => setCreating((v) => !v)}>
          <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
        <button className="icon-button" title="Log out" aria-label="Log out" onClick={onLogout}>
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 17l5-5-5-5M15 12H4" />
          </svg>
        </button>
      </header>

      {creating && (
        <NewChatForm
          onCancel={() => setCreating(false)}
          onSubmit={async (phone, name) => {
            await onCreateChat(phone, name);
            setCreating(false);
          }}
        />
      )}

      <div className="search">
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search" />
      </div>

      <ul className="chat-list">
        {visibleChats.map((chat) => {
          const last = chat.messages.at(-1);
          return (
            <li key={chat.chatId}>
              <button
                className={`chat-item${chat.chatId === activeChatId ? ' active' : ''}`}
                onClick={() => onOpenChat(chat.chatId)}
              >
                <Avatar name={chat.name} seed={chat.chatId} />
                <div className="chat-item-body">
                  <div className="chat-item-row">
                    <span className="chat-item-name">{chat.name}</span>
                    {last && <span className="chat-item-time">{formatListTime(last.timestamp)}</span>}
                  </div>
                  <div className="chat-item-row">
                    <span className="chat-item-preview">
                      {last ? `${last.direction === 'out' ? 'You: ' : ''}${last.text}` : 'No messages yet'}
                    </span>
                    {chat.unread > 0 && <span className="badge">{chat.unread}</span>}
                  </div>
                </div>
              </button>
            </li>
          );
        })}
        {visibleChats.length === 0 && (
          <li className="chat-list-empty">
            {chats.length === 0 ? 'No chats yet. Press + to message a phone number.' : 'Nothing found'}
          </li>
        )}
      </ul>
    </aside>
  );
}

function NewChatForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (phone: string, name: string) => Promise<void>;
  onCancel: () => void;
}) {
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await onSubmit(phone, name);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create chat');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="new-chat" onSubmit={handleSubmit}>
      <input
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="Phone number, e.g. 79991234567"
        inputMode="tel"
        autoFocus
        required
      />
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name (optional)" />
      {error && <div className="form-error">{error}</div>}
      <div className="new-chat-actions">
        <button type="button" className="secondary-button" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="primary-button" disabled={loading}>
          {loading ? 'Checking…' : 'Start chat'}
        </button>
      </div>
    </form>
  );
}
