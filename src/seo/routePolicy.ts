/** Personal routes stay crawlable so crawlers can read their noindex directive. */
export const isPersonalPath = (path: string) =>
  /^\/(?:profile|login|new-roadmap|edit-roadmap|course|percurso)(?:\/|$)/.test(path) ||
  /^\/aulas\/o-que-estudar(?:\/|$)/.test(path) ||
  /^\/roadmap\/(?:view|v)(?:\/|$)/.test(path);
