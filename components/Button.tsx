import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  isLoading, 
  className = '', 
  disabled,
  ...props 
}) => {
  const baseStyles = "px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed border";
  
  // Linear-style variants
  const variants = {
    // White/Light Gray with dark text for primary
    primary: "bg-[#F2F2F2] hover:bg-white text-black border-transparent shadow-sm shadow-white/10",
    // Dark gray with light text for secondary
    secondary: "bg-[#252628] hover:bg-[#2E3033] text-[#E8E8E8] border-[#3E4044] shadow-sm",
    // Red tint for danger
    danger: "bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/20",
    // Ghost
    ghost: "bg-transparent hover:bg-[#252628] text-gray-400 hover:text-[#E8E8E8] border-transparent"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Processing...
        </>
      ) : children}
    </button>
  );
};