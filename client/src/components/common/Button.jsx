import React from 'react';
import { Loader2 } from 'lucide-react';

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  icon: Icon = null,
  iconPosition = 'left',
  className = '',
  onClick,
  type = 'button',
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-200 select-none focus:outline-none focus:ring-offset-2 focus:ring-offset-[#F2F1EE] disabled:opacity-40 disabled:cursor-not-allowed';

  const variants = {
    primary: 'bg-[#30152F] hover:bg-[#200F22] text-[#F2F1EE] font-semibold shadow-sm hover:shadow-md active:scale-[0.98] focus:ring-2 focus:ring-[#30152F]/40',
    secondary: 'bg-[#E8E6E2] hover:bg-[#DDD9D4] text-[#30152F] border border-[rgba(49,35,49,0.18)] hover:border-[#30152F]/40 active:scale-[0.98] focus:ring-2 focus:ring-[#30152F]/20',
    outline: 'bg-transparent hover:bg-[#E8E6E2] text-[#30152F] border border-[rgba(49,35,49,0.22)] hover:border-[#30152F]/50 active:scale-[0.98] focus:ring-2 focus:ring-[#30152F]/20',
    multiverse: 'bg-[#30152F] hover:bg-[#200F22] text-[#F2F1EE] border border-[#200F22] shadow-sm active:scale-[0.98] focus:ring-2 focus:ring-[#30152F]/40',
    danger: 'bg-[#A83842] hover:bg-[#8F2D36] text-[#FFFFFF] font-semibold shadow-sm active:scale-[0.98] focus:ring-2 focus:ring-[#A83842]/30',
    ghost: 'bg-transparent hover:bg-[#E8E6E2]/80 text-[#654D63] hover:text-[#200F22] focus:ring-2 focus:ring-[#30152F]/20',
  };

  const sizes = {
    sm: 'text-xs px-3 py-1.5 rounded-lg gap-1.5',
    md: 'text-sm px-4 py-2 rounded-lg gap-2',
    lg: 'text-base px-6 py-3 rounded-xl gap-2.5',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`${baseStyles} ${variants[variant] || variants.primary} ${sizes[size]} ${className}`}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
          <span>Processing...</span>
        </>
      ) : (
        <>
          {Icon && iconPosition === 'left' && <Icon className="w-4 h-4 shrink-0" />}
          {children}
          {Icon && iconPosition === 'right' && <Icon className="w-4 h-4 shrink-0" />}
        </>
      )}
    </button>
  );
};
