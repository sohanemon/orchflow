import type { ExecutionReport, ExecutionStep, OrchflowConfig } from "../types";
import { ConditionalBranch } from "./conditional-branch";

export class Orchflow {
	protected actions: Array<() => Promise<void>> = [];
	private executionSteps: ExecutionStep[] = [];
	private config: OrchflowConfig;
	private abortController: AbortController = new AbortController();
	private maxHistorySize = 1000;

	constructor(config: OrchflowConfig = {}) {
		this.config = {
			defaultTimeout: 15000,
			debug: false,
			delayBetweenActions: 0,
			...config,
		};
	}

	private findElement(selector: string): Element | null {
		try {
			return document.querySelector(selector);
		} catch (error) {
			if (this.config.debug) {
				console.debug(`⚡[Orchflow] Invalid selector: ${selector}`, error);
			}
			return null;
		}
	}

	private isElementVisible(element: Element): boolean {
		const style = window.getComputedStyle(element);
		return (
			style.display !== "none" &&
			style.visibility !== "hidden" &&
			style.opacity !== "0"
		);
	}

	private isElementClickable(element: Element): boolean {
		return (
			this.isElementVisible(element) && !(element as HTMLButtonElement).disabled
		);
	}

	private waitForCondition(
		condition: () => boolean,
		timeoutMs: number = this.config.defaultTimeout ?? 15000,
	): Promise<void> {
		return new Promise((resolve, reject) => {
			const timestamp = Date.now();
			let pollInterval: ReturnType<typeof setTimeout> | null = null;
			const pollDelay = 50;

			const check = () => {
				if (this.abortController.signal.aborted) {
					if (pollInterval) clearTimeout(pollInterval);
					reject(new Error("Orchestration aborted"));
					return;
				}

				try {
					if (condition()) {
						if (pollInterval) clearTimeout(pollInterval);
						resolve();
						return;
					}
				} catch (error) {
					if (this.config.debug) {
						console.debug("⚡[Orchflow] Condition check error:", error);
					}
				}

				if (Date.now() - timestamp > timeoutMs) {
					if (pollInterval) clearTimeout(pollInterval);
					reject(
						new Error(`Timeout waiting for condition after ${timeoutMs}ms`),
					);
					return;
				}

				pollInterval = setTimeout(check, pollDelay);
			};

			check();
		});
	}

	private async executeAction(
		action: string,
		fn: () => Promise<void>,
		selector?: string,
	): Promise<void> {
		const timestamp = performance.now();

		try {
			if (this.config.debug) {
				console.info(
					`⚡[Orchflow] Executing: ${action}${selector ? ` (${selector})` : ""}`,
				);
			}

			await fn();

			const duration = performance.now() - timestamp;
			if (selector) {
				this.addExecutionStep({
					action,
					selector,
					timestamp,
					duration,
					status: "success",
				});
			}

			if (this.config.debug) {
				console.info(
					`⚡[Orchflow] ✓ ${action} completed in ${duration.toFixed(2)}ms`,
				);
			}

			if (this.config.delayBetweenActions) {
				await new Promise((resolve) =>
					setTimeout(resolve, this.config.delayBetweenActions),
				);
			}
		} catch (error) {
			const duration = performance.now() - timestamp;
			const errorMessage =
				error instanceof Error ? error.message : String(error);

			if (selector) {
				this.addExecutionStep({
					action,
					selector,
					timestamp,
					duration,
					status: "error",
					error: errorMessage,
				});
			}

			if (this.config.debug) {
				console.error(`⚡[Orchflow] ✗ ${action} failed: ${errorMessage}`);
			}

			throw error;
		}
	}

	private addExecutionStep(step: ExecutionStep): void {
		this.executionSteps.push(step);
		// NOTE: Keep only recent steps to prevent unbounded memory growth
		if (this.executionSteps.length > this.maxHistorySize) {
			this.executionSteps = this.executionSteps.slice(-this.maxHistorySize);
		}
	}

	click(selector: string, options?: { timeout?: number }): this {
		this.actions.push(async () => {
			await this.executeAction(
				"click",
				async () => {
					await this.waitForCondition(
						() => !!this.findElement(selector),
						options?.timeout,
					);
					const element = this.findElement(selector);
					if (!element) {
						throw new Error(`Element not found: ${selector}`);
					}
					(element as HTMLElement).click();
				},
				selector,
			);
		});
		return this;
	}

	fill(
		selector: string,
		text: string,
		options?: { timeout?: number; retry?: number },
	): this {
		this.actions.push(async () => {
			let lastError: Error | null = null;
			const retries = options?.retry ?? 1;

			for (let i = 0; i < retries; i++) {
				try {
					await this.executeAction(
						"fill",
						async () => {
							await this.waitForCondition(
								() => !!this.findElement(selector),
								options?.timeout,
							);
							const element = this.findElement(selector) as HTMLInputElement;
							if (!element) {
								throw new Error(`Element not found: ${selector}`);
							}
							element.focus();
							element.value = text;
							element.dispatchEvent(new Event("input", { bubbles: true }));
							element.dispatchEvent(new Event("change", { bubbles: true }));
						},
						selector,
					);
					return;
				} catch (error) {
					lastError = error as Error;
					if (i < retries - 1) {
						await new Promise((resolve) => setTimeout(resolve, 100 * (i + 1)));
					}
				}
			}

			if (lastError) throw lastError;
		});
		return this;
	}

	type(
		selector: string,
		text: string,
		options?: { timeout?: number; delay?: number },
	): this {
		this.actions.push(async () => {
			await this.executeAction(
				"type",
				async () => {
					await this.waitForCondition(
						() => !!this.findElement(selector),
						options?.timeout,
					);
					const element = this.findElement(selector) as HTMLInputElement;
					if (!element) {
						throw new Error(`Element not found: ${selector}`);
					}
					element.focus();

					for (const char of text) {
						element.value += char;
						element.dispatchEvent(
							new KeyboardEvent("keydown", { key: char, bubbles: true }),
						);
						element.dispatchEvent(new Event("input", { bubbles: true }));

						if (options?.delay) {
							await new Promise((resolve) =>
								setTimeout(resolve, options.delay),
							);
						}
					}

					element.dispatchEvent(new Event("change", { bubbles: true }));
				},
				selector,
			);
		});
		return this;
	}

	clear(selector: string, options?: { timeout?: number }): this {
		this.actions.push(async () => {
			await this.executeAction(
				"clear",
				async () => {
					await this.waitForCondition(
						() => !!this.findElement(selector),
						options?.timeout,
					);
					const element = this.findElement(selector) as HTMLInputElement;
					if (!element) {
						throw new Error(`Element not found: ${selector}`);
					}
					element.focus();
					element.value = "";
					element.dispatchEvent(new Event("input", { bubbles: true }));
					element.dispatchEvent(new Event("change", { bubbles: true }));
				},
				selector,
			);
		});
		return this;
	}

	hover(selector: string, options?: { timeout?: number }): this {
		this.actions.push(async () => {
			await this.executeAction(
				"hover",
				async () => {
					await this.waitForCondition(
						() => !!this.findElement(selector),
						options?.timeout,
					);
					const element = this.findElement(selector);
					if (!element) {
						throw new Error(`Element not found: ${selector}`);
					}
					element.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
				},
				selector,
			);
		});
		return this;
	}

	select(
		selector: string,
		value: string,
		options?: { timeout?: number },
	): this {
		this.actions.push(async () => {
			await this.executeAction(
				"select",
				async () => {
					await this.waitForCondition(
						() => !!this.findElement(selector),
						options?.timeout,
					);
					const element = this.findElement(selector) as HTMLSelectElement;
					if (!element) {
						throw new Error(`Element not found: ${selector}`);
					}
					element.value = value;
					element.dispatchEvent(new Event("change", { bubbles: true }));
				},
				selector,
			);
		});
		return this;
	}

	press(key: string, options?: { timeout?: number }): this {
		this.actions.push(async () => {
			await this.executeAction("press", async () => {
				if (options?.timeout) {
					await this.waitForCondition(() => true, options.timeout);
				}

				document.dispatchEvent(
					new KeyboardEvent("keydown", {
						key,
						bubbles: true,
						cancelable: true,
					}),
				);
				document.dispatchEvent(
					new KeyboardEvent("keyup", { key, bubbles: true, cancelable: true }),
				);
			});
		});
		return this;
	}

	waitFor(selector: string, options?: { timeout?: number }): this {
		this.actions.push(async () => {
			await this.executeAction(
				"waitFor",
				async () => {
					await this.waitForCondition(
						() => !!this.findElement(selector),
						options?.timeout,
					);
				},
				selector,
			);
		});
		return this;
	}

	waitForVisible(selector: string, options?: { timeout?: number }): this {
		this.actions.push(async () => {
			await this.executeAction(
				"waitForVisible",
				async () => {
					await this.waitForCondition(() => {
						const element = this.findElement(selector);
						return element ? this.isElementVisible(element) : false;
					}, options?.timeout);
				},
				selector,
			);
		});
		return this;
	}

	waitForClickable(selector: string, options?: { timeout?: number }): this {
		this.actions.push(async () => {
			await this.executeAction(
				"waitForClickable",
				async () => {
					await this.waitForCondition(() => {
						const element = this.findElement(selector);
						return element ? this.isElementClickable(element) : false;
					}, options?.timeout);
				},
				selector,
			);
		});
		return this;
	}

	waitForText(text: string, options?: { timeout?: number }): this {
		this.actions.push(async () => {
			await this.executeAction("waitForText", async () => {
				await this.waitForCondition(
					() => document.body.textContent?.includes(text) ?? false,
					options?.timeout,
				);
			});
		});
		return this;
	}

	waitForAttribute(
		selector: string,
		attribute: string,
		value: string,
		options?: { timeout?: number },
	): this {
		this.actions.push(async () => {
			await this.executeAction(
				"waitForAttribute",
				async () => {
					await this.waitForCondition(() => {
						const element = this.findElement(selector);
						return element?.getAttribute(attribute) === value;
					}, options?.timeout);
				},
				selector,
			);
		});
		return this;
	}

	assert(
		selector: string,
		options?: {
			text?: string;
			visible?: boolean;
			exists?: boolean;
			timeout?: number;
		},
	): this {
		this.actions.push(async () => {
			await this.executeAction(
				"assert",
				async () => {
					const element = this.findElement(selector);

					if (options?.exists === false && element) {
						throw new Error(`Element ${selector} should not exist but it does`);
					}

					if (options?.exists !== false && !element) {
						throw new Error(`Element ${selector} does not exist`);
					}

					if (options?.text && element?.textContent !== options.text) {
						throw new Error(
							`Element ${selector} text is "${element?.textContent}" but expected "${options.text}"`,
						);
					}

					if (options?.visible && element) {
						if (!this.isElementVisible(element)) {
							throw new Error(`Element ${selector} is not visible`);
						}
					}
				},
				selector,
			);
		});
		return this;
	}

	getText(selector: string, options?: { timeout?: number }): this {
		this.actions.push(async () => {
			await this.executeAction(
				"getText",
				async () => {
					await this.waitForCondition(
						() => !!this.findElement(selector),
						options?.timeout,
					);
					const element = this.findElement(selector);
					const text = element?.textContent ?? "";
					const lastStep = this.executionSteps[this.executionSteps.length - 1];
					if (lastStep) {
						lastStep.value = text;
					}
				},
				selector,
			);
		});

		return this;
	}

	getAttribute(
		selector: string,
		attribute: string,
		options?: { timeout?: number },
	): this {
		this.actions.push(async () => {
			await this.executeAction(
				"getAttribute",
				async () => {
					await this.waitForCondition(
						() => !!this.findElement(selector),
						options?.timeout,
					);
					const element = this.findElement(selector);
					const value = element?.getAttribute(attribute) ?? null;
					const lastStep = this.executionSteps[this.executionSteps.length - 1];
					if (lastStep) {
						lastStep.value = value;
					}
				},
				selector,
			);
		});

		return this;
	}

	delay(ms: number): this {
		this.actions.push(async () => {
			await this.executeAction("delay", async () => {
				await new Promise((resolve) => setTimeout(resolve, ms));
			});
		});
		return this;
	}

	if(condition: () => boolean | Promise<boolean>): ConditionalBranch {
		return new ConditionalBranch(this, condition);
	}

	getActions(): Array<() => Promise<void>> {
		return this.actions;
	}

	async execute(): Promise<ExecutionReport> {
		const timestamp = performance.now();
		this.executionSteps = []; // INFO: Reset history on each execute

		try {
			for (const action of this.actions) {
				await action();
			}

			const totalDuration = performance.now() - timestamp;

			const report: ExecutionReport = {
				totalDuration,
				steps: this.executionSteps,
				success: true,
			};

			if (this.config.debug) {
				console.info("⚡[Orchflow] Execution completed successfully", report);
			}

			return report;
		} catch (error) {
			const totalDuration = performance.now() - timestamp;
			const errorMessage =
				error instanceof Error ? error.message : String(error);

			const report: ExecutionReport = {
				totalDuration,
				steps: this.executionSteps,
				success: false,
				error: errorMessage,
			};

			if (this.config.debug) {
				console.error("⚡[Orchflow] Execution failed", report);
			}

			throw error;
		}
	}

	abort(): void {
		this.abortController.abort();
	}

	getHistory(): ExecutionStep[] {
		return [...this.executionSteps];
	}

	destroy(): void {
		this.abort();
		this.actions = [];
		this.executionSteps = [];
	}
}
