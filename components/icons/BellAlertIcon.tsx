import React from 'react';

export const BellAlertIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.5}
    {...props}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M14.25 18a2.25 2.25 0 11-4.5 0"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M4.5 9.75a7.5 7.5 0 1115 0c0 3.364.896 5.39 1.574 6.47.31.49-.027 1.155-.611 1.155H3.537c-.584 0-.92-.665-.611-1.155.678-1.08 1.574-3.106 1.574-6.47z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 2.25v1.5"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M7.5 4.5l.75 1.299"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M16.5 4.5L15.75 5.799"
    />
  </svg>
);
