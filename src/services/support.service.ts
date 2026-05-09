import api from '@/lib/api';

export interface SupportContactPayload {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export const supportService = {
  /**
   * Submit the public contact form. Forwards the message to the support inbox
   * (queued mailable on the backend). Returns 202 on success.
   */
  contact: (payload: SupportContactPayload): Promise<{ message: string }> =>
    api.post('/support/contact', payload).then((r) => r.data),
};
