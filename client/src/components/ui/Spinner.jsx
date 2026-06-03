const Spinner = ({ size = 'md', color = 'indigo' }) => {
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12',
  };

  const colors = {
    indigo: 'border-indigo-500',
    white: 'border-white',
    slate: 'border-slate-400',
    cyan: 'border-cyan-500',
  };

  return (
    <div
      className={`${sizes[size]} animate-spin rounded-full border-2 border-slate-200 border-t-2 ${colors[color]}`}
      role="status"
      aria-label="Loading"
    />
  );
};

export default Spinner;
