export interface Credentials {
  apiUrl: string;
  idInstance: string;
  apiTokenInstance: string;
}

export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';

export interface Message {
  /** idMessage from GREEN-API, or a local id while the message is being sent */
  id: string;
  text: string;
  direction: 'in' | 'out';
  /** Unix time in milliseconds */
  timestamp: number;
  status?: MessageStatus;
}

export interface Chat {
  /** MAX chatId used for sending (numeric id, or `<phone>@c.us` as a fallback) */
  chatId: string;
  /** Digits only, e.g. 79991234567 */
  phone: string;
  name: string;
  messages: Message[];
  unread: number;
}

/** Subset of the GREEN-API incoming notification body that this app uses. */
export interface NotificationBody {
  typeWebhook: string;
  timestamp?: number;
  idMessage?: string;
  status?: string;
  chatId?: string;
  senderData?: {
    chatId: string;
    chatName?: string;
    sender?: string;
    senderName?: string;
    senderContactName?: string;
    senderPhoneNumber?: number | string;
  };
  messageData?: {
    typeMessage: string;
    textMessageData?: { textMessage: string };
    extendedTextMessageData?: { text: string };
  };
}

export interface Notification {
  receiptId: number;
  body: NotificationBody;
}
