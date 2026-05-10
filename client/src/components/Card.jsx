import React from 'react';

const Card = ({ children, className = '' }) => {
  return (
    <div className={`theme-surface rounded-[1.75rem] border p-6 backdrop-blur ${className}`}>
      {children}
    </div>
  );
};

export default Card;
