export type Button = 'verticalView' | 'horizontalView' | 'download' | 'exportNotes';

export type ButtonElementTypes = 'link' | 'button';

export type ButtonArgs = {
  text: string;
  type: ButtonElementTypes;
  shouldAuthenticate?: boolean;
  href?: string;
  action?: () => void;
};
