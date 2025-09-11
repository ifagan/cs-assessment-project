// src/hooks/useFormWithValidation.ts
import { useState } from "react";
import { validateRequiredFields, ValidationErrors } from "../validation";

export function useFormWithValidation<T extends Record<string, any>>(
  initialValues: T,
  requiredFields: (keyof T)[]
) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<ValidationErrors<T>>({});

  // Generic field setter
  function handleChange<K extends keyof T>(field: K, value: T[K]) {
    setValues((prev) => ({ ...prev, [field]: value }));
  }

  // Validate required fields
  function validate(): boolean {
    const validation = validateRequiredFields(values, requiredFields);
    setErrors(validation);
    return Object.keys(validation).length === 0;
  }

  // Reset form + errors
  function reset(newValues: T = initialValues) {
    setValues(newValues);
    setErrors({});
  }

  return {
    values,
    setValues,
    errors,
    handleChange,
    validate,
    reset,
  };
}
