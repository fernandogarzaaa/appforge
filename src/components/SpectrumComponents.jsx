/**
 * AppForge Spectrum - AGENT COMPONENT TEMPLATE
 * Copy this template and use for all new components
 * This ensures consistency across all 8 parallel agents
 */

// ============================================================
// EXAMPLE: Button Component Using Spectrum Design System
// ============================================================

import { semanticColors, gradients } from '@/config/spectrum-colors';

/**
 * Spectrum-compliant Button Component
 * - Uses Spectrum colors (no hardcoded colors)
 * - Supports semantic variants (primary, secondary, success, error, warning, info)
 * - Includes dark mode support
 * - Uses transition tokens
 * - Minimum 16px padding on components
 */
export function SpectrumButton({
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  ...props
}) {
  const variants = {
    primary: 'bg-spectrum-purple-600 hover:bg-spectrum-purple-700 text-white dark:bg-spectrum-purple-700 dark:hover:bg-spectrum-purple-600',
    secondary: 'bg-spectrum-indigo-600 hover:bg-spectrum-indigo-700 text-white dark:bg-spectrum-indigo-700 dark:hover:bg-spectrum-indigo-600',
    success: 'bg-spectrum-emerald-500 hover:bg-spectrum-emerald-600 text-white dark:bg-spectrum-emerald-600 dark:hover:bg-spectrum-emerald-500',
    error: 'bg-spectrum-red-500 hover:bg-spectrum-red-600 text-white dark:bg-spectrum-red-600 dark:hover:bg-spectrum-red-500',
    warning: 'bg-spectrum-amber-500 hover:bg-spectrum-amber-600 text-white dark:bg-spectrum-amber-600 dark:hover:bg-spectrum-amber-500',
    info: 'bg-spectrum-cyan-500 hover:bg-spectrum-cyan-600 text-white dark:bg-spectrum-cyan-600 dark:hover:bg-spectrum-cyan-500',
    outline: 'border-2 border-spectrum-purple-600 text-spectrum-purple-600 hover:bg-spectrum-purple-50 dark:border-spectrum-purple-400 dark:text-spectrum-purple-400 dark:hover:bg-spectrum-purple-900',
    ghost: 'text-spectrum-purple-600 hover:bg-spectrum-purple-50 dark:text-spectrum-purple-400 dark:hover:bg-spectrum-purple-900',
  };

  const sizes = {
    sm: 'px-3 py-1 text-sm rounded-md',
    md: 'px-4 py-2 text-base rounded-md',      // 16px padding (minimum)
    lg: 'px-6 py-3 text-lg rounded-lg',        // 24px padding
    xl: 'px-8 py-4 text-xl rounded-lg',        // 32px padding
  };

  return (
    <button
      className={`
        font-semibold
        transition-colors transition-base
        disabled:opacity-50 disabled:cursor-not-allowed
        focus:outline-none focus:ring-2 focus:ring-spectrum-purple-600 focus:ring-offset-2
        dark:focus:ring-offset-gray-900
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
}

// ============================================================
// EXAMPLE: Card Component Using Spectrum Design System
// ============================================================

export function SpectrumCard({
  variant = 'default',
  children,
  className = '',
  ...props
}) {
  const variants = {
    default: 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800',
    primary: 'bg-spectrum-purple-50 dark:bg-spectrum-purple-900 border border-spectrum-purple-200 dark:border-spectrum-purple-800',
    success: 'bg-spectrum-emerald-50 dark:bg-spectrum-emerald-900 border border-spectrum-emerald-200 dark:border-spectrum-emerald-800',
    error: 'bg-spectrum-red-50 dark:bg-spectrum-red-900 border border-spectrum-red-200 dark:border-spectrum-red-800',
    warning: 'bg-spectrum-amber-50 dark:bg-spectrum-amber-900 border border-spectrum-amber-200 dark:border-spectrum-amber-800',
  };

  return (
    <div
      className={`
        rounded-lg
        shadow-lg
        p-6
        transition-shadow transition-base
        hover:shadow-xl
        ${variants[variant]}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
}

// ============================================================
// EXAMPLE: Badge Component Using Spectrum Design System
// ============================================================

export function SpectrumBadge({
  variant = 'primary',
  children,
  className = '',
  ...props
}) {
  const variants = {
    success: 'bg-spectrum-emerald-50 text-spectrum-emerald-700 border border-spectrum-emerald-200 dark:bg-spectrum-emerald-900 dark:text-spectrum-emerald-100 dark:border-spectrum-emerald-700',
    error: 'bg-spectrum-red-50 text-spectrum-red-700 border border-spectrum-red-200 dark:bg-spectrum-red-900 dark:text-spectrum-red-100 dark:border-spectrum-red-700',
    warning: 'bg-spectrum-amber-50 text-spectrum-amber-700 border border-spectrum-amber-200 dark:bg-spectrum-amber-900 dark:text-spectrum-amber-100 dark:border-spectrum-amber-700',
    info: 'bg-spectrum-cyan-50 text-spectrum-cyan-700 border border-spectrum-cyan-200 dark:bg-spectrum-cyan-900 dark:text-spectrum-cyan-100 dark:border-spectrum-cyan-700',
    primary: 'bg-spectrum-purple-50 text-spectrum-purple-700 border border-spectrum-purple-200 dark:bg-spectrum-purple-900 dark:text-spectrum-purple-100 dark:border-spectrum-purple-700',
  };

  return (
    <span
      className={`
        inline-flex
        items-center
        px-3
        py-1
        rounded-full
        text-sm
        font-medium
        ${variants[variant]}
        ${className}
      `}
      {...props}
    >
      {children}
    </span>
  );
}

// ============================================================
// EXAMPLE: Gradient Header Using Spectrum Design System
// ============================================================

export function SpectrumGradientHeader({
  title,
  subtitle,
  children,
  className = '',
  ...props
}) {
  return (
    <div
      className={`
        bg-gradient-to-r
        from-spectrum-purple-600
        via-spectrum-indigo-600
        to-spectrum-cyan-500
        text-white
        p-8
        rounded-lg
        shadow-spectrum
        dark:from-spectrum-purple-700
        dark:via-spectrum-indigo-700
        dark:to-spectrum-cyan-600
        ${className}
      `}
      {...props}
    >
      {title && (
        <h1 className="text-5xl font-heading font-bold mb-2">
          {title}
        </h1>
      )}
      {subtitle && (
        <p className="text-lg opacity-90">
          {subtitle}
        </p>
      )}
      {children}
    </div>
  );
}

// ============================================================
// EXAMPLE: Form Input Using Spectrum Design System
// ============================================================

export function SpectrumInput({
  variant = 'default',
  error = false,
  success = false,
  className = '',
  ...props
}) {
  const baseStyles = `
    w-full
    px-4
    py-2
    border
    rounded-md
    font-body
    text-base
    transition-all
    transition-base
    focus:outline-none
    focus:ring-2
    focus:ring-spectrum-purple-600
    focus:border-spectrum-purple-600
    dark:bg-gray-800
    dark:text-white
  `;

  const variantStyles = error
    ? 'border-spectrum-red-500 focus:ring-spectrum-red-600 focus:border-spectrum-red-600'
    : success
    ? 'border-spectrum-emerald-500 focus:ring-spectrum-emerald-600 focus:border-spectrum-emerald-600'
    : 'border-gray-300 dark:border-gray-600';

  return (
    <input
      className={`
        ${baseStyles}
        ${variantStyles}
        ${className}
      `}
      {...props}
    />
  );
}

// ============================================================
// EXAMPLE: Alert Component Using Spectrum Design System
// ============================================================

export function SpectrumAlert({
  variant = 'info',
  title,
  message,
  className = '',
  ...props
}) {
  const variants = {
    success: {
      bg: 'bg-spectrum-emerald-50 dark:bg-spectrum-emerald-900',
      border: 'border-spectrum-emerald-200 dark:border-spectrum-emerald-700',
      title: 'text-spectrum-emerald-900 dark:text-spectrum-emerald-100',
      message: 'text-spectrum-emerald-800 dark:text-spectrum-emerald-200',
    },
    error: {
      bg: 'bg-spectrum-red-50 dark:bg-spectrum-red-900',
      border: 'border-spectrum-red-200 dark:border-spectrum-red-700',
      title: 'text-spectrum-red-900 dark:text-spectrum-red-100',
      message: 'text-spectrum-red-800 dark:text-spectrum-red-200',
    },
    warning: {
      bg: 'bg-spectrum-amber-50 dark:bg-spectrum-amber-900',
      border: 'border-spectrum-amber-200 dark:border-spectrum-amber-700',
      title: 'text-spectrum-amber-900 dark:text-spectrum-amber-100',
      message: 'text-spectrum-amber-800 dark:text-spectrum-amber-200',
    },
    info: {
      bg: 'bg-spectrum-cyan-50 dark:bg-spectrum-cyan-900',
      border: 'border-spectrum-cyan-200 dark:border-spectrum-cyan-700',
      title: 'text-spectrum-cyan-900 dark:text-spectrum-cyan-100',
      message: 'text-spectrum-cyan-800 dark:text-spectrum-cyan-200',
    },
  };

  const style = variants[variant];

  return (
    <div
      className={`
        border
        rounded-lg
        p-4
        ${style.bg}
        ${style.border}
        ${className}
      `}
      {...props}
    >
      {title && (
        <h4 className={`font-semibold mb-1 ${style.title}`}>
          {title}
        </h4>
      )}
      {message && (
        <p className={style.message}>
          {message}
        </p>
      )}
    </div>
  );
}

// ============================================================
// USAGE EXAMPLES FOR AGENTS
// ============================================================

export function SpectrumComponentShowcase() {
  return (
    <div className="p-8 space-y-8">
      {/* ✓ Button Examples */}
      <div>
        <h2 className="text-2xl font-heading font-bold mb-4">Buttons</h2>
        <div className="flex gap-4 flex-wrap">
          <SpectrumButton variant="primary">Primary</SpectrumButton>
          <SpectrumButton variant="secondary">Secondary</SpectrumButton>
          <SpectrumButton variant="success">Success</SpectrumButton>
          <SpectrumButton variant="error">Error</SpectrumButton>
          <SpectrumButton variant="outline">Outline</SpectrumButton>
          <SpectrumButton variant="ghost">Ghost</SpectrumButton>
        </div>
      </div>

      {/* ✓ Card Examples */}
      <div>
        <h2 className="text-2xl font-heading font-bold mb-4">Cards</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SpectrumCard variant="default">
            <h3 className="text-lg font-semibold mb-2">Default Card</h3>
            <p className="text-gray-600 dark:text-gray-400">Standard card with neutral styling.</p>
          </SpectrumCard>
          <SpectrumCard variant="primary">
            <h3 className="text-lg font-semibold mb-2">Primary Card</h3>
            <p className="text-spectrum-purple-700 dark:text-spectrum-purple-300">Card with primary spectrum color.</p>
          </SpectrumCard>
        </div>
      </div>

      {/* ✓ Badge Examples */}
      <div>
        <h2 className="text-2xl font-heading font-bold mb-4">Badges</h2>
        <div className="flex gap-3 flex-wrap">
          <SpectrumBadge variant="success">✓ Success</SpectrumBadge>
          <SpectrumBadge variant="error">✗ Error</SpectrumBadge>
          <SpectrumBadge variant="warning">⚠ Warning</SpectrumBadge>
          <SpectrumBadge variant="info">ℹ Info</SpectrumBadge>
        </div>
      </div>

      {/* ✓ Gradient Header Example */}
      <SpectrumGradientHeader
        title="Spectrum Gradient"
        subtitle="Purple → Indigo → Cyan"
      />

      {/* ✓ Form Input Examples */}
      <div>
        <h2 className="text-2xl font-heading font-bold mb-4">Form Inputs</h2>
        <div className="space-y-4 max-w-md">
          <SpectrumInput placeholder="Default input" />
          <SpectrumInput placeholder="Success input" success />
          <SpectrumInput placeholder="Error input" error />
        </div>
      </div>

      {/* ✓ Alert Examples */}
      <div>
        <h2 className="text-2xl font-heading font-bold mb-4">Alerts</h2>
        <div className="space-y-4">
          <SpectrumAlert variant="success" title="Success" message="Operation completed successfully!" />
          <SpectrumAlert variant="error" title="Error" message="Something went wrong!" />
          <SpectrumAlert variant="warning" title="Warning" message="Please review this!" />
          <SpectrumAlert variant="info" title="Info" message="Here's some information." />
        </div>
      </div>
    </div>
  );
}

// ============================================================
// KEY RULES FOR ALL AGENTS
// ============================================================
/*
1. ✓ ALWAYS import colors from @/config/spectrum-colors
   import { colors, semanticColors, gradients } from '@/config/spectrum-colors';

2. ✓ NEVER hardcode colors
   ✗ Bad: backgroundColor: '#7E22CE'
   ✓ Good: className="bg-spectrum-purple-600"

3. ✓ ALWAYS use Tailwind classes with spectrum- prefix
   ✓ Good: className="bg-spectrum-purple-600 text-spectrum-cyan-500"
   ✗ Bad: className="bg-purple-600" (wrong prefix)

4. ✓ ALWAYS include dark: variants
   ✓ Good: className="bg-white dark:bg-gray-900"

5. ✓ ALWAYS use transition tokens
   ✓ Good: className="transition-colors transition-base"

6. ✓ MINIMUM 16px padding (p-4)
   ✓ Good: className="p-4 px-6 py-3"

7. ✓ ALWAYS use spacing grid (4, 8, 12, 16, 20, 24, etc.)
   ✓ Good: className="gap-4 mb-6 mt-8"

8. ✓ ALWAYS use semantic colors for status
   ✓ Good: className="bg-spectrum-emerald-500" (for success)
   ✗ Bad: className="bg-green-500" (non-spectrum)

9. ✓ ALWAYS validate with spectrum palette
   Reference: spectrum-palette.json

10. ✓ ALWAYS test dark mode
    Add dark: to all color classes
*/
