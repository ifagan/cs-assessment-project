export type ValidationErrors<T> = Partial<Record<keyof T, string>>;

export function validateRequiredFields<T extends Record<string, any>>(
	values: T,
	requiredFields: (keyof T)[]
): ValidationErrors<T> {
	const errors: ValidationErrors<T> = {};
	for (const field of requiredFields) {
		if (!values[field] || String(values[field]).trim() === "") {
			const fieldLabels: Record<string, string> = {
				title: "Title",
				description: "Description",
				project_id: "Project",
				due_date: "Due date",
			};

			errors[field] = `${fieldLabels[field] || field} is required.`;

		}
	}
	return errors;
}
