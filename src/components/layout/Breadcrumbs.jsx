/**
 * Breadcrumbs Component
 * Contextual breadcrumb navigation with auto-generation from route
 * Licensed under the Apache License, Version 2.0. See LICENSE for details.
 */
import React, { useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { getBreadcrumbs } from '@/lib/navigationRoutes';

export default function Breadcrumbs({ customBreadcrumbs = null }) {
  const location = useLocation();

  const breadcrumbs = useMemo(() => {
    if (customBreadcrumbs) {
      return customBreadcrumbs;
    }
    return getBreadcrumbs(location.pathname);
  }, [location.pathname, customBreadcrumbs]);

  if (!breadcrumbs || breadcrumbs.length <= 1) {
    return null;
  }

  return (
    <nav className="px-6 py-3 flex items-center gap-2 text-sm" aria-label="Breadcrumb">
      {breadcrumbs.map((breadcrumb, index) => {
        const isLast = index === breadcrumbs.length - 1;

        return (
          <React.Fragment key={breadcrumb.path}>
            {index > 0 && (
              <ChevronRight
                size={16}
                className="text-spectrum-gray-400 dark:text-spectrum-gray-600 flex-shrink-0"
              />
            )}
            {isLast ? (
              <span className="text-spectrum-gray-700 dark:text-spectrum-gray-300 font-medium">
                {breadcrumb.label}
              </span>
            ) : (
              <Link
                to={breadcrumb.path}
                className="text-spectrum-purple-600 dark:text-spectrum-purple-400 hover:text-spectrum-purple-700 dark:hover:text-spectrum-purple-300 transition-colors"
              >
                {breadcrumb.label}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
