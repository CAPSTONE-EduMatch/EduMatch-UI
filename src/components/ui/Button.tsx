import React, { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  loadingText?: string;
  variant?: 'primary' | 'secondary' | 'outline';
  fullWidth?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  children,
  isLoading = false,
  loadingText,
  variant = 'primary',
  fullWidth = false,
  className = '',
  ...props
}) => {
  const baseClasses = "py-3 rounded-full shadow-md transition-colors font-medium";
  
  const variantClasses = {
    primary: "bg-[#126E64] text-white hover:opacity-90",
    secondary: "bg-gray-100 text-gray-800 hover:bg-gray-200",
    outline: "border border-gray-300 text-gray-700 hover:bg-gray-50"
  };
  
  const widthClass = fullWidth ? "w-full" : "px-8";
  
  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${widthClass} ${className}`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? (loadingText || 'Loading...') : children}
    </button>
  );
};

export default Button;