import { Fragment, useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import type { Chat, MessageStatus } from '../types';
import { Avatar } from './Avatar';
import { formatDay, formatTime, isSameDay } from './time';

interface ChatViewProps {
  chat: Chat;
  onSend: (text: string) => void;
  onBack: () => void;
}

const MAX_LENGTH = 4000;

export function ChatView({ chat, onSend, onBack }: ChatViewProps) {
  const [draft, setDraft] = useState('');
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const list = listRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [chat.messages.length, chat.chatId]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [chat.chatId]);

  function submit(event?: FormEvent) {
    event?.preventDefault();
    const text = draft.trim();
    if (!text) return;
    onSend(text);
    setDraft('');
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      submit();
    }
  }

  return (
    <section className="chat">
      <header className="chat-header">
        <button className="icon-button back-button" aria-label="Back to chats" onClick={onBack}>
          <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <Avatar name={chat.name} seed={chat.chatId} size={40} />
        <div className="chat-header-text">
          <h3>{chat.name}</h3>
          <span>{chat.phone ? `+${chat.phone}` : `id ${chat.chatId}`}</span>
        </div>
      </header>

      <div className="messages" ref={listRef}>
        {chat.messages.length === 0 && <div className="messages-empty">Write the first message</div>}
        {chat.messages.map((message, index) => {
          const prev = chat.messages[index - 1];
          const showDay = !prev || !isSameDay(prev.timestamp, message.timestamp);
          return (
            <Fragment key={message.id}>
              {showDay && (
                <div className="day-divider">
                  <span>{formatDay(message.timestamp)}</span>
                </div>
              )}
              <div className={`bubble bubble-${message.direction}`}>
                <span className="bubble-text">{message.text}</span>
                <span className="bubble-meta">
                  {formatTime(message.timestamp)}
                  {message.direction === 'out' && <StatusIcon status={message.status ?? 'sent'} />}
                </span>
              </div>
            </Fragment>
          );
        })}
      </div>

      <form className="composer" onSubmit={submit}>
        <textarea
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message"
          rows={1}
          maxLength={MAX_LENGTH}
        />
        <button type="submit" className="send-button" disabled={!draft.trim()} aria-label="Send">
          <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
            <path d="M4 12 20 4l-4 16-4-6-8-2Z" fill="currentColor" />
          </svg>
        </button>
      </form>
    </section>
  );
}

function StatusIcon({ status }: { status: MessageStatus }) {
  if (status === 'sending') {
    return (
      <svg className="status status-sending" viewBox="0 0 16 16" width="14" height="14" aria-label="Sending">
        <circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <path d="M8 5v3.5l2 1.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  }
  if (status === 'failed') {
    return (
      <span className="status status-failed" title="Not sent" aria-label="Not sent">
        !
      </span>
    );
  }
  const double = status === 'delivered' || status === 'read';
  return (
    <svg
      className={`status status-${status}`}
      viewBox="0 0 20 16"
      width="18"
      height="14"
      aria-label={status}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 8.5 5.5 12 12 4.5" />
      {double && <path d="M8.5 11.5 9 12l6.5-7.5" />}
    </svg>
  );
}
