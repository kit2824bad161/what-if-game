import React from 'react';

export const Badge = ({
  children,
  variant = 'neutral',
  size = 'md',
  className = '',
  icon: Icon = null,
}) => {
  const variantStyles = {
    canon: 'bg-[#287A59]/10 text-[#287A59] border border-[#287A59]/25',
    hypothetical: 'bg-[#986421]/10 text-[#986421] border border-[#986421]/25',
    alternate: 'bg-[#986421]/10 text-[#986421] border border-[#986421]/25',
    warning: 'bg-[#A83842]/10 text-[#A83842] border border-[#A83842]/25',
    multiverse: 'bg-[#E8E6E2] text-[#30152F] border border-[rgba(49,35,49,0.18)]',
    neutral: 'bg-[#E8E6E2] text-[#654D63] border border-[rgba(49,35,49,0.12)]',
    cyan: 'bg-[#3C6E9E]/10 text-[#3C6E9E] border border-[#3C6E9E]/25',
    info: 'bg-[#3C6E9E]/10 text-[#3C6E9E] border border-[#3C6E9E]/25',
  };

  const sizeStyles = {
    sm: 'text-[11px] font-mono px-2 py-0.5 rounded-md tracking-wide',
    md: 'text-xs font-medium px-2.5 py-1 rounded-md',
    lg: 'text-sm font-medium px-3 py-1.5 rounded-lg',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 transition-colors ${variantStyles[variant] || variantStyles.neutral} ${sizeStyles[size]} ${className}`}
    >
      {Icon && <Icon className="w-3.5 h-3.5 shrink-0" />}
      {children}
    </span>
  );
};
