import { useId } from 'react';
import s from './CourseCheckbox.module.css';
import * as RadixCheckbox from '@radix-ui/react-checkbox';
import { CheckIcon } from '../CheckIcon';

type CourseCheckboxProps = {
  id?: string;
  label?: string;
  ariaLabel?: string;
  ariaLabelledBy?: string;
  checked: boolean;
  toggleChecked: (checked: boolean) => void;
  labelClassName?: string;
};

export const CourseCheckbox = ({
  id,
  label,
  ariaLabel,
  ariaLabelledBy,
  checked,
  toggleChecked,
  labelClassName,
}: CourseCheckboxProps) => {
  const generatedId = useId();
  const checkboxId = id ?? (label ? generatedId : undefined);

  return (
    <div className={s.CheckboxContainer}>
      <RadixCheckbox.Root
        className={s.CheckBox}
        id={checkboxId}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        checked={checked}
        onCheckedChange={(state) => toggleChecked(state === true)}
      >
        <RadixCheckbox.Indicator className={s.CheckboxIndicator}>
          <CheckIcon className="stroke-box-primary" />
        </RadixCheckbox.Indicator>
      </RadixCheckbox.Root>
      {label && (
        <label className={`${s.CheckBoxLabel} ${labelClassName || ''}`} htmlFor={checkboxId}>
          {label}
        </label>
      )}
    </div>
  );
};
