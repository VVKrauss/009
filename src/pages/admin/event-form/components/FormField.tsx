import React from 'react';

interface FormFieldProps {
  label: string;
  name: string;
  type?: 'text' | 'textarea' | 'number' | 'date' | 'time' | 'select' | 'checkbox';
  value: string | number | boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  placeholder?: string;
  required?: boolean;
  options?: { value: string; label: string }[];
  min?: number;
  max?: number;
  step?: number;
  rows?: number;
  error?: string;
  className?: string;
  disabled?: boolean;
  helpText?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  name,
  type = 'text',
  value,
  onChange,
  placeholder = '',
  required = false,
  options = [],
  min,
  max,
  step,
  rows = 3,
  error,
  className = '',
  disabled = false,
  helpText,
}) => {
  const renderField = () => {
    switch (type) {
      case 'textarea':
        return (
          <textarea
            id={name}
            name={name}
            value={value as string}
            onChange={onChange}
            placeholder={placeholder}
            rows={rows}
            className={`w-full p-3 border rounded-lg ${
              error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
            } bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500`}
            required={required}
            disabled={disabled}
          />
        );
      
      case 'select':
        return (
          <select
            id={name}
            name={name}
            value={value as string}
            onChange={onChange}
            className={`w-full p-3 border rounded-lg ${
              error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
            } bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500`}
            required={required}
            disabled={disabled}
          >
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );
      
      case 'checkbox':
        return (
          <label className="inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              id={name}
              name={name}
              checked={value as boolean}
              onChange={onChange}
              className="sr-only peer"
              disabled={disabled}
            />
            <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
            <span className="ms-3">{label}</span>
          </label>
        );
      
      case 'number':
        return (
          <input
            type="number"
            id={name}
            name={name}
            value={value as number}
            onChange={onChange}
            placeholder={placeholder}
            min={min}
            max={max}
            step={step}
            className={`w-full p-3 border rounded-lg ${
              error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
            } bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500`}
            required={required}
            disabled={disabled}
          />
        );
      
      default:
        return (
          <input
            type={type}
            id={name}
            name={name}
            value={value as string}
            onChange={onChange}
            placeholder={placeholder}
            className={`w-full p-3 border rounded-lg ${
              error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
            } bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500`}
            required={required}
            disabled={disabled}
          />
        );
    }
  };

  return (
    <div className={`mb-4 ${className}`}>
      {type !== 'checkbox' && (
        <label htmlFor={name} className="block mb-2 font-medium text-gray-700 dark:text-gray-300">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      {renderField()}
      
      {helpText && !error && (
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{helpText}</p>
      )}
      
      {error && (
        <p className="mt-1 text-sm text-red-500">{error}</p>
      )}
    </div>
  );
};

export default FormField;