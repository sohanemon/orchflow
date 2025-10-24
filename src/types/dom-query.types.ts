export type DomQuery = {
	el: HTMLElement | null;
	isDisabled: boolean;
	isVisible: boolean;
	isHovered: boolean;
	hasAttribute: (attr: string) => boolean;
	click: () => void;
	focus: () => void;
	value: string;
	query: (selector: string) => DomQuery;
};

export type DomQueryHandler = (selector: string) => DomQuery;
