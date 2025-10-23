"use client";

import * as React from "react";
import {
	type ExecutionReport,
	Orchestrator,
	type OrchestratorConfig,
} from "../utils/orchestrator";

export function useOrchestrator(config?: OrchestratorConfig) {
	const [isExecuting, setIsExecuting] = React.useState(false);
	const [report, setReport] = React.useState<ExecutionReport | null>(null);
	const [error, setError] = React.useState<string | null>(null);

	const execute = React.useCallback(
		async (callback: (orch: Orchestrator) => Orchestrator) => {
			setIsExecuting(true);
			setError(null);

			try {
				const orchestrator = new Orchestrator(config);
				const chainedOrch = callback(orchestrator);
				const executionReport = await chainedOrch.execute();

				setReport(executionReport);
				return executionReport;
			} catch (err) {
				const errorMessage = err instanceof Error ? err.message : String(err);
				setError(errorMessage);
				throw err;
			} finally {
				setIsExecuting(false);
			}
		},
		[config],
	);

	return {
		execute,
		isExecuting,
		report,
		error,
	};
}
