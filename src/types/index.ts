export type ExecutionStep = {
	action: string;
	selector?: string;
	value?: string | null;
	timestamp: number;
	duration: number;
	status: "success" | "error";
	error?: string;
};

export type ExecutionReport = {
	totalDuration: number;
	steps: ExecutionStep[];
	success: boolean;
	error?: string;
};

export type OrchflowConfig = {
	defaultTimeout?: number;
	debug?: boolean;
	delayBetweenActions?: number;
};
