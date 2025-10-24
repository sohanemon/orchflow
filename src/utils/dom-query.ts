import type { DomQuery } from "../types/dom-query.types";

export function query(selector: string, node?: HTMLElement | null): DomQuery {
	const el = (node || document).querySelector<HTMLElement>(selector);

	const wrapper: DomQuery = {
		el,
		query: (sel) => query(sel, el),

		get isDisabled() {
			return (el as HTMLButtonElement)?.disabled ?? false;
		},
		get isVisible() {
			return !!el && !!(el.offsetWidth || el.offsetHeight);
		},
		get isHovered() {
			return !!el && el.matches(":hover");
		},

		set value(val: string) {
			if (el instanceof HTMLInputElement) el.value = val;
		},
		hasAttribute: (attr) => !!el && el.hasAttribute(attr),

		// NOTE: actions
		click: () => el?.click(),
		focus: () => (el as HTMLElement)?.focus(),
	};

	return wrapper;
}
