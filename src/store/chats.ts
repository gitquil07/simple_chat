import type { Chat, Message, MessageStatus, NotificationBody } from '../types';

export interface ChatsState {
  chats: Chat[];
  activeChatId: string | null;
}

export type ChatsAction =
  | { type: 'addChat'; chat: Chat }
  | { type: 'openChat'; chatId: string | null }
  | { type: 'addMessage'; chatId: string; message: Message }
  | { type: 'updateMessage'; chatId: string; localId: string; patch: Partial<Message> }
  | { type: 'notification'; body: NotificationBody };

export const emptyState: ChatsState = { chats: [], activeChatId: null };

export function normalizePhone(value: string): string {
  return value.replace(/\D/g, '');
}

export function lastActivity(chat: Chat): number {
  return chat.messages.at(-1)?.timestamp ?? 0;
}

function updateChat(state: ChatsState, chatId: string, fn: (chat: Chat) => Chat): ChatsState {
  return { ...state, chats: state.chats.map((c) => (c.chatId === chatId ? fn(c) : c)) };
}

function appendMessage(chat: Chat, message: Message, isActive: boolean): Chat {
  if (chat.messages.some((m) => m.id === message.id)) return chat;
  const messages = [...chat.messages, message].sort((a, b) => a.timestamp - b.timestamp);
  const unread = message.direction === 'in' && !isActive ? chat.unread + 1 : chat.unread;
  return { ...chat, messages, unread };
}

function extractText(body: NotificationBody): string | null {
  const data = body.messageData;
  if (!data) return null;
  if (data.typeMessage === 'textMessage') return data.textMessageData?.textMessage ?? null;
  if (data.typeMessage === 'extendedTextMessage') return data.extendedTextMessageData?.text ?? null;
  return null;
}

/** Incoming notifications carry a numeric MAX chatId; chats created by phone may use `<phone>@c.us`. */
function findChat(state: ChatsState, chatId: string, phone: string): Chat | undefined {
  return state.chats.find(
    (c) =>
      c.chatId === chatId ||
      (phone !== '' && (c.phone === phone || c.chatId === `${phone}@c.us`)),
  );
}

const STATUS_RANK: Record<MessageStatus, number> = {
  failed: 0,
  sending: 1,
  sent: 2,
  delivered: 3,
  read: 4,
};

function handleNotification(state: ChatsState, body: NotificationBody): ChatsState {
  if (body.typeWebhook === 'outgoingMessageStatus') {
    const status = body.status as MessageStatus | undefined;
    if (!status || !(status in STATUS_RANK) || !body.idMessage) return state;
    return {
      ...state,
      chats: state.chats.map((chat) => ({
        ...chat,
        messages: chat.messages.map((m) =>
          m.id === body.idMessage &&
          (status === 'failed' || STATUS_RANK[status] > STATUS_RANK[m.status ?? 'sent'])
            ? { ...m, status }
            : m,
        ),
      })),
    };
  }

  const isIncoming = body.typeWebhook === 'incomingMessageReceived';
  const isOutgoing =
    body.typeWebhook === 'outgoingMessageReceived' ||
    body.typeWebhook === 'outgoingAPIMessageReceived';
  if (!isIncoming && !isOutgoing) return state;

  const text = extractText(body);
  const sender = body.senderData;
  if (text === null || !sender?.chatId || !body.idMessage) return state;

  const message: Message = {
    id: body.idMessage,
    text,
    direction: isIncoming ? 'in' : 'out',
    timestamp: (body.timestamp ?? Date.now() / 1000) * 1000,
    status: isIncoming ? undefined : 'sent',
  };

  const phone = normalizePhone(String(sender.senderPhoneNumber ?? ''));
  const existing = findChat(state, sender.chatId, phone);

  if (existing) {
    const isActive = state.activeChatId === existing.chatId;
    return updateChat(state, existing.chatId, (chat) => appendMessage(chat, message, isActive));
  }

  // Only start a new chat for messages someone sent us; outgoing ones belong to chats we know.
  if (!isIncoming) return state;
  const name =
    sender.chatName || sender.senderContactName || sender.senderName || (phone ? `+${phone}` : sender.chatId);
  const chat: Chat = { chatId: sender.chatId, phone, name, messages: [message], unread: 1 };
  return { ...state, chats: [chat, ...state.chats] };
}

export function chatsReducer(state: ChatsState, action: ChatsAction): ChatsState {
  switch (action.type) {
    case 'addChat': {
      const existing = findChat(state, action.chat.chatId, action.chat.phone);
      if (existing) return { ...state, activeChatId: existing.chatId };
      return { chats: [action.chat, ...state.chats], activeChatId: action.chat.chatId };
    }
    case 'openChat':
      return {
        activeChatId: action.chatId,
        chats: state.chats.map((c) => (c.chatId === action.chatId ? { ...c, unread: 0 } : c)),
      };
    case 'addMessage':
      return updateChat(state, action.chatId, (chat) => appendMessage(chat, action.message, true));
    case 'updateMessage':
      return updateChat(state, action.chatId, (chat) => {
        // The API notification for this message may already have arrived under its real id.
        const duplicate = action.patch.id && chat.messages.some((m) => m.id === action.patch.id);
        const messages = duplicate
          ? chat.messages.filter((m) => m.id !== action.localId)
          : chat.messages.map((m) => (m.id === action.localId ? { ...m, ...action.patch } : m));
        return { ...chat, messages };
      });
    case 'notification':
      return handleNotification(state, action.body);
  }
}

const storageKey = (idInstance: string) => `green-max-chats:${idInstance}`;

export function loadChats(idInstance: string): ChatsState {
  try {
    const raw = localStorage.getItem(storageKey(idInstance));
    if (!raw) return emptyState;
    const chats = JSON.parse(raw) as Chat[];
    return { chats, activeChatId: null };
  } catch {
    return emptyState;
  }
}

export function saveChats(idInstance: string, chats: Chat[]): void {
  try {
    localStorage.setItem(storageKey(idInstance), JSON.stringify(chats));
  } catch {
    // Storage is a convenience; the chat keeps working without it.
  }
}
