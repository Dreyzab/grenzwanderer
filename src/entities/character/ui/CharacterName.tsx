import React from 'react';
import clsx from 'clsx';

interface CharacterNameProps {
  name: string;
  className?: string;
}

export const CharacterName: React.FC<CharacterNameProps> = ({ name, className = '' }) => {
  return (
    <div 
      className={clsx(
        'bg-surface/70 text-text-primary',
        'px-[15px] py-[5px]',
        'rounded-full',
        'text-base',
        'font-medium',
        'mt-[-20px]',
        'relative z-[3]',
        className
      )}
    >
      {name}
    </div>
  );
}; 