"use client";

import * as React from "react";
import type { ExecutionReport, OrchflowConfig } from "../types";
import { Orchflow } from "../utils/orchestrator";

export function useOrchflow(_config?: OrchflowConfig) {
	const [isExecuting, setIsExecuting] = React.useState(false);
	const [report, setReport] = React.useState<ExecutionReport | null>(null);
	const [error, setError] = React.useState<string | null>(null);

	const isMountedRef = React.useRef(true);

	const abortControllerRef = React.useRef<AbortController | null>(null);

	// biome-ignore lint/correctness/useExhaustiveDependencies: object rerenders every time
	const config = React.useMemo(() => _config, [JSON.stringify(_config)]);

	React.useEffect(() => {
		return () => {
			isMountedRef.current = false;
			abortControllerRef.current?.abort();
		};
	}, []);

	const execute = React.useCallback(
		async (callback: (orch: Orchflow) => Orchflow) => {
			if (!isMountedRef.current) return null;

			setIsExecuting(true);
			setError(null);

			try {
				abortControllerRef.current = new AbortController();

				const orchestrator = new Orchflow(config);
				const chainedOrch = callback(orchestrator);
				const executionReport = await chainedOrch.execute();

				if (isMountedRef.current) {
					setReport(executionReport);
				}
				return executionReport;
			} catch (err) {
				const errorMessage = err instanceof Error ? err.message : String(err);

				if (isMountedRef.current) {
					setError(errorMessage);
				}
				return null;
			} finally {
				if (isMountedRef.current) {
					setIsExecuting(false);
				}
			}
		},
		[config],
	);

	const reset = React.useCallback(() => {
		setReport(null);
		setError(null);
		setIsExecuting(false);
	}, []);

	const cancel = React.useCallback(() => {
		abortControllerRef.current?.abort();
		if (isMountedRef.current) {
			setIsExecuting(false);
		}
	}, []);

	return {
		execute,
		isExecuting,
		report,
		error,
		reset,
		cancel,
	};
}
