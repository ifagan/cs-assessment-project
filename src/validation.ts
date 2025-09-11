export type ValidationErrors<T> = Partial<Record<keyof T, string>>;

export function validateRequiredFields<T extends Record<string, any>>(
  values: T,
  requiredFields: (keyof T)[]
): ValidationErrors<T> {
  const errors: ValidationErrors<T> = {};
  for (const field of requiredFields) {
    if (!values[field] || String(values[field]).trim() === "") {
      errors[field] = `${String(field)} is required.`;
    }
  }
  return errors;
}
