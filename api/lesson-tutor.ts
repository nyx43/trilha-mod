import type { IncomingMessage, ServerResponse } from 'http';
import { handleLessonTutor } from '../server/lessonTutor';

export default function handler(req: IncomingMessage, res: ServerResponse) {
  return handleLessonTutor(req, res, process.env, 'hosted');
}
