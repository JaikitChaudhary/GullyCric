import React from 'react';

const Card = ({ children, className = '' }) => {
  return (
    <div className={`rounded-[1.75rem] border border-orange-300/10 bg-slate-950/75 p-6 shadow-[0_20px_55px_rgba(2,6,23,0.35)] backdrop-blur ${className}`}>
      {children}
    </div>
  );
};

export default Card;