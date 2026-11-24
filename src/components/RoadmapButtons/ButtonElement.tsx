import { ReactElement } from 'react';
import { ButtonArgs } from './types';

type ButtonElementProps = ButtonArgs;

const ButtonElement = ({ type, text, ...args }: ButtonElementProps): ReactElement => {
  const renderLinkButton = (
    <div className="group relative flex h-fit w-fit">
      <a
        type="button"
        href={args.href}
        className="z-20 rounded-sm bg-primary p-2 text-center font-title duration-100 hover:bg-primary-hover hover:shadow-primary-white"
      >
        {text}
      </a>
    </div>
  );

  const renderButton = (
    <div className="group relative flex h-fit w-fit">
      <button
        type="button"
        className="z-20 rounded-sm bg-primary p-2 font-title duration-100 hover:bg-primary-hover hover:shadow-primary-white"
        onClick={args.action}
      >
        {text}
      </button>
    </div>
  );

  const buttonElements = {
    link: renderLinkButton,
    button: renderButton,
  };

  return buttonElements[type];
};

export default ButtonElement;
