import React from 'react';

export const ThumbUpIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    {...props}
  >
    <path d="M3 10.25A1.75 1.75 0 014.75 8.5H7v8H4.75A1.75 1.75 0 013 14.75v-4.5z" />
    <path d="M8.5 6.75A3.25 3.25 0 0111.633 3.6l.217-.053a1.75 1.75 0 012.077 1.263l.62 2.49H18a2.75 2.75 0 012.75 2.75v1.75A2.75 2.75 0 0118 14.55h-2.663l.447 1.493a2.75 2.75 0 01-.163 1.91l-.492 1.024A3.5 3.5 0 0111.987 20H9.75A3.25 3.25 0 016.5 16.75v-8.5z" />
  </svg>
);
