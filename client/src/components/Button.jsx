import React from 'react';

const Button = ({ children, onClick, disabled = false, className = '', variant = 'primary' }) => {
  const baseClasses = 'inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary: 'bg-gradient-to-r from-orange-500 to-amber-300 text-slate-950 shadow-[0_18px_40px_rgba(249,115,22,0.28)] hover:shadow-[0_22px_50px_rgba(249,115,22,0.36)]',
    secondary: 'bg-slate-700 text-slate-100 hover:bg-slate-600',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

export default Button;