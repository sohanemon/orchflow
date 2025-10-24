import type { DomQuery } from "../types/dom-query.types";

export function query(selector: string): DomQuery {
	const el = document.querySelector<HTMLElement>(selector);

	const wrapper: DomQuery = {
		el,
		isDisabled: () => (el as HTMLButtonElement)?.disabled ?? false,
		isVisible: () => !!el && !!(el.offsetWidth || el.offsetHeight),
		hovered: () => !!el && el.matches(":hover"),
		hasAttribute: (attr) => !!el && el.hasAttribute(attr),
		click: () => el?.click(),
		focus: () => (el as HTMLElement)?.focus(),
		setValue: (val) => {
			if (el instanceof HTMLInputElement) el.value = val;
		},
		get: (sel) => query(sel),
	};

	return wrapper;
}
