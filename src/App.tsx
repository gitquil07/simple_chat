import { useCallback, useEffect, useReducer, useState } from 'react';
import { ApiError, checkAccount, sendMessage } from './api/greenApi';
import { ChatView } from './components/ChatView';
import { LoginScreen } from './components/LoginScreen';
import { Logo } from './components/Logo';
import { Sidebar } from './components/Sidebar';
import { useNotificationPolling } from './hooks/useNotificationPolling';
import { chatsReducer, loadChats, normalizePhone, saveChats } from './store/chats';
import type { Credentials, NotificationBody } from './types';

const CREDENTIALS_KEY = 'green-max-credentials';

function loadCredentials(): Credentials | null {
  try {
    const raw = localStorage.getItem(CREDENTIALS_KEY);
    return raw ? (JSON.parse(raw) as Credentials) : null;
  } catch {
    return null;
  }
}

export default function App() {
  const [creds, setCreds] = useState<Credentials | null>(loadCredentials);

  function login(next: Credentials) {
    try {
      localStorage.setItem(CREDENTIALS_KEY, JSON.stringify(next));
    } catch {
      // Without storage the user simply signs in again after a reload.
    }
    setCreds(next);
  }

  function logout() {
    try {
      localStorage.removeItem(CREDENTIALS_KEY);
    } catch {
      // Nothing to clean up.
    }
    setCreds(null);
  }

  if (!creds) return <LoginScreen onLogin={login} />;
  return <Messenger key={creds.idInstance} creds={creds} onLogout={logout} />;
}

function Messenger({ creds, onLogout }: { creds: Credentials; onLogout: () => void }) {
  const [state, dispatch] = useReducer(chatsReducer, creds.idInstance, loadChats);

  useEffect(() => {
    saveChats(creds.idInstance, state.chats);
  }, [creds.idInstance, state.chats]);

  const handleNotification = useCallback((body: NotificationBody) => {
    dispatch({ type: 'notification', body });
  }, []);
  const pollingState = useNotificationPolling(creds, handleNotification);

  const activeChat = state.chats.find((c) => c.chatId === state.activeChatId) ?? null;

  async function createChat(rawPhone: string, rawName: string) {
    const phone = normalizePhone(rawPhone);
    if (phone.length < 10 || phone.length > 15) {
      throw new Error('Enter the full number with country code, e.g. 79991234567');
    }

    // MAX addresses users by a numeric chatId; CheckAccount resolves it from the phone number.
    let chatId = `${phone}@c.us`;
    try {
      const account = await checkAccount(creds, phone);
      if (!account.exist) throw new Error('This number has no MAX account');
      if (account.chatId) chatId = account.chatId;
    } catch (err) {
      if (!(err instanceof ApiError) || err.status === 401 || err.status === 403) throw err;
      // CheckAccount can be rate-limited; sending to <phone>@c.us still works.
    }

    dispatch({
      type: 'addChat',
      chat: { chatId, phone, name: rawName.trim() || `+${phone}`, messages: [], unread: 0 },
    });
  }

  async function send(chatId: string, text: string) {
    const localId = `local-${crypto.randomUUID()}`;
    dispatch({
      type: 'addMessage',
      chatId,
      message: { id: localId, text, direction: 'out', timestamp: Date.now(), status: 'sending' },
    });
    try {
      const { idMessage } = await sendMessage(creds, chatId, text);
      dispatch({ type: 'updateMessage', chatId, localId, patch: { id: idMessage, status: 'sent' } });
    } catch {
      dispatch({ type: 'updateMessage', chatId, localId, patch: { status: 'failed' } });
    }
  }

  return (
    <div className={`app${activeChat ? ' has-active-chat' : ''}`}>
      <Sidebar
        chats={state.chats}
        activeChatId={state.activeChatId}
        idInstance={creds.idInstance}
        pollingState={pollingState}
        onOpenChat={(chatId) => dispatch({ type: 'openChat', chatId })}
        onCreateChat={createChat}
        onLogout={onLogout}
      />
      {activeChat ? (
        <ChatView
          chat={activeChat}
          onSend={(text) => void send(activeChat.chatId, text)}
          onBack={() => dispatch({ type: 'openChat', chatId: null })}
        />
      ) : (
        <section className="chat chat-placeholder">
          <Logo size={72} />
          <p>Select a chat or start a new one with the + button</p>
        </section>
      )}
    </div>
  );
}
