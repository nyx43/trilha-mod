import type { IncomingMessage, ServerResponse } from 'http';
import { handleFeedback } from '../server/feedback';

export default function handler(req: IncomingMessage, res: ServerResponse) {
  return handleFeedback(req, res, process.env);
}
