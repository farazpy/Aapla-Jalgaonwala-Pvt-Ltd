import React from 'react';
import { Link as RouterLink, LinkProps as RouterLinkProps } from 'react-router-dom';

export interface LinkProps extends Omit<RouterLinkProps, 'to'> {
  href?: string;
  to?: string;
  children?: React.ReactNode;
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
  target?: string;
  rel?: string;
}

export function Link({ href, to, children, ...props }: LinkProps) {
  const target = to || href || '/';
  // If external link
  if (typeof target === 'string' && (target.startsWith('http://') || target.startsWith('https://') || target.startsWith('mailto:') || target.startsWith('tel:'))) {
    return (
      <a href={target} {...props}>
        {children}
      </a>
    );
  }

  return (
    <RouterLink to={target} {...props}>
      {children}
    </RouterLink>
  );
}

export default Link;
