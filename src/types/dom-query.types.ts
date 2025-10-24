export type DomQuery = {
	el: HTMLElement | null;
	isDisabled: () => boolean;
	isVisible: () => boolean;
	hovered: () => boolean;
	hasAttribute: (attr: string) => boolean;
	click: () => void;
	focus: () => void;
	setValue: (val: string) => void;
	get: (selector: string) => DomQuery;
};

export type DomQueryHandler = (selector: string) => DomQuery;
