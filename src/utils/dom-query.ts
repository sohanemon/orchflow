import type { DomQuery } from "../types/dom-query.types";

export function query(selector: string, node?: HTMLElement | null): DomQuery {
	const el = (node || document).querySelector<HTMLElement>(selector);

	const wrapper: DomQuery = {
		el,
		getIsDisabled: () => (el as HTMLButtonElement)?.disabled ?? false,
		getIsVisible: () => !!el && !!(el.offsetWidth || el.offsetHeight),
		getIsHovered: () => !!el && el.matches(":hover"),
		hasAttribute: (attr) => !!el && el.hasAttribute(attr),
		click: () => el?.click(),
		focus: () => (el as HTMLElement)?.focus(),
		setValue: (val) => {
			if (el instanceof HTMLInputElement) el.value = val;
		},
		query: (sel) => query(sel, el),
	};

	return wrapper;
}
