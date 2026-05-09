import { forwardRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const variants = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  danger: 'btn-danger',
  ghost: 'btn-ghost',
  subtle: '',
};

const sizes = {
  sm: 'btn-sm',
  md: '',
  lg: 'btn-lg',
};

export const Button = forwardRef(function Button(
  {
    variant = 'subtle',
    size = 'md',
    className = '',
    loading,
    disabled,
    children,
    to,
    ...props
  },
  ref
) {
  const cls = `btn ${variants[variant] || ''} ${sizes[size] || ''} ${className}`.trim();

  if (to && !disabled) {
    return (
      <Link to={to} className={cls} ref={ref} {...props}>
        {children}
      </Link>
    );
  }

  return (
    <motion.button
      ref={ref}
      className={cls}
      disabled={disabled || loading}
      whileTap={{ scale: 0.97 }}
      whileHover={{ scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      {...props}
    >
      {loading && <span className="btn-spinner" aria-hidden="true" />}
      {children}
    </motion.button>
  );
});
