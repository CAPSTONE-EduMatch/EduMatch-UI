import React, { InputHTMLAttributes } from 'react';
import { Input } from '../ui';

export interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  name: string;
  error?: string;
  required?: boolean;
  helpText?: string;
  hint?: string;
  rounded?: 'full' | 'lg';
}

const FormField: React.FC<FormFieldProps> = ({
  label,
  name,
  error,
  required,
  helpText,
  hint,
  rounded = 'lg',
  ...inputProps
}) => {
  return (
    <Input
      label={label}
      error={error}
      required={required}
      helpText={helpText || hint}
      {...inputProps}
    />
  );
};

export default FormField;