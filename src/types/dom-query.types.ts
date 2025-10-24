export type DomQuery = {
	el: HTMLElement | null;
	getIsDisabled: () => boolean;
	getIsVisible: () => boolean;
	getIsHovered: () => boolean;
	hasAttribute: (attr: string) => boolean;
	click: () => void;
	focus: () => void;
	setValue: (val: string) => void;
	query: (selector: string) => DomQuery;
};

export type DomQueryHandler = (selector: string) => DomQuery;
