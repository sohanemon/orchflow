import type { ExecutionReport, ExecutionStep, OrchflowConfig } from "../types";
import { ConditionalBranch } from "./conditional-branch";

export class Orchflow {
	protected actions: Array<() => Promise<void>> = [];
	private executionSteps: ExecutionStep[] = [];
	private config: OrchflowConfig;
	private abortController: AbortController = new AbortController();

	constructor(config: OrchflowConfig = {}) {
		this.config = {
			defaultTimeout: 15000,
			debug: false,
			delayBetweenActions: 0,
			...config,
		};
	}

	private async executeAction(
		action: string,
		fn: () => Promise<void>,
		selector?: string,
	): Promise<void> {
		const startTime = performance.now();

		try {
			if (this.config.debug) {
				console.log(
					`[Orchflow] Executing: ${action}${selector ? ` (${selector})` : ""}`,
				);
			}

			await fn();

			const duration = performance.now() - startTime;
			if (selector)
				this.executionSteps.push({
					action,
					selector,
					timestamp: startTime,
					duration,
					status: "success",
				});

			if (this.config.debug) {
				console.log(
					`[Orchflow] ✓ ${action} completed in ${duration.toFixed(2)}ms`,
				);
			}

			// Delay between actions
			if (this.config.delayBetweenActions) {
				await new Promise((resolve) =>
					setTimeout(resolve, this.config.delayBetweenActions),
				);
			}
		} catch (error) {
			const duration = performance.now() - startTime;
			const errorMessage =
				error instanceof Error ? error.message : String(error);

			if (selector)
				this.executionSteps.push({
					action,
					selector,
					timestamp: startTime,
					duration,
					status: "error",
					error: errorMessage,
				});

			if (this.config.debug) {
				console.error(`[Orchflow] ✗ ${action} failed: ${errorMessage}`);
			}

			throw error;
		}
	}

	private waitForCondition(
		condition: () => boolean,
		timeoutMs: number = this.config.defaultTimeout ?? 15000,
	): Promise<void> {
		return new Promise((resolve, reject) => {
			const startTime = Date.now();

			const check = () => {
				if (this.abortController.signal.aborted) {
					reject(new Error("Orchestration aborted"));
					return;
				}

				try {
					if (condition()) {
						resolve();
						return;
					}
				} catch (error) {
					if (this.config.debug) {
						console.debug("[Orchflow] Condition check error:", error);
					}
				}

				if (Date.now() - startTime > timeoutMs) {
					reject(
						new Error(`Timeout waiting for condition after ${timeoutMs}ms`),
					);
					return;
				}

				requestAnimationFrame(check);
			};

			check();
		});
	}

	click(selector: string, options?: { timeout?: number }): this {
		this.actions.push(async () => {
			await this.executeAction(
				"click",
				async () => {
					await this.waitForCondition(
						() => !!document.querySelector(selector),
						options?.timeout,
					);
					const element = document.querySelector(selector);
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
								() => !!document.querySelector(selector),
								options?.timeout,
							);
							const element = document.querySelector(selector);
							if (!element) {
								throw new Error(`Element not found: ${selector}`);
							}
							const inputElement = element as HTMLInputElement;
							inputElement.focus();
							inputElement.value = text;
							inputElement.dispatchEvent(new Event("input", { bubbles: true }));
							inputElement.dispatchEvent(
								new Event("change", { bubbles: true }),
							);
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
						() => !!document.querySelector(selector),
						options?.timeout,
					);
					const element = document.querySelector(selector);
					if (!element) {
						throw new Error(`Element not found: ${selector}`);
					}
					const inputElement = element as HTMLInputElement;
					inputElement.focus();

					for (const char of text) {
						inputElement.value += char;
						inputElement.dispatchEvent(
							new KeyboardEvent("keydown", { key: char, bubbles: true }),
						);
						inputElement.dispatchEvent(new Event("input", { bubbles: true }));

						if (options?.delay) {
							await new Promise((resolve) =>
								setTimeout(resolve, options.delay),
							);
						}
					}

					inputElement.dispatchEvent(new Event("change", { bubbles: true }));
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
						() => !!document.querySelector(selector),
						options?.timeout,
					);
					const element = document.querySelector(selector);
					if (!element) {
						throw new Error(`Element not found: ${selector}`);
					}
					const inputElement = element as HTMLInputElement;
					inputElement.focus();
					inputElement.value = "";
					inputElement.dispatchEvent(new Event("input", { bubbles: true }));
					inputElement.dispatchEvent(new Event("change", { bubbles: true }));
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
						() => !!document.querySelector(selector),
						options?.timeout,
					);
					const element = document.querySelector(selector);
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
						() => !!document.querySelector(selector),
						options?.timeout,
					);
					const element = document.querySelector(selector);
					if (!element) {
						throw new Error(`Element not found: ${selector}`);
					}
					const selectElement = element as HTMLSelectElement;
					selectElement.value = value;
					selectElement.dispatchEvent(new Event("change", { bubbles: true }));
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
						() => !!document.querySelector(selector),
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
						const element = document.querySelector(selector);
						if (!element) return false;
						const style = window.getComputedStyle(element);
						return (
							style.display !== "none" &&
							style.visibility !== "hidden" &&
							style.opacity !== "0"
						);
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
						const element = document.querySelector(selector);
						if (!element) return false;
						const style = window.getComputedStyle(element);
						const isVisible =
							style.display !== "none" && style.visibility !== "hidden";
						const isEnabled = !(element as HTMLButtonElement).disabled;
						return isVisible && isEnabled;
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
						const element = document.querySelector(selector);
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
					const element = document.querySelector(selector);

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
						const style = window.getComputedStyle(element);
						const isVisible =
							style.display !== "none" &&
							style.visibility !== "hidden" &&
							style.opacity !== "0";
						if (!isVisible) {
							throw new Error(`Element ${selector} is not visible`);
						}
					}
				},
				selector,
			);
		});
		return this;
	}

	getText(selector: string, options?: { timeout?: number }): Promise<string> {
		return new Promise((resolve, reject) => {
			const startTime = performance.now();
			try {
				this.waitForCondition(
					() => !!document.querySelector(selector),
					options?.timeout,
				)
					.then(() => {
						const element = document.querySelector(selector);
						const text = element?.textContent ?? "";
						const duration = performance.now() - startTime;

						this.executionSteps.push({
							action: "getText",
							selector,
							value: text,
							timestamp: startTime,
							duration,
							status: "success",
						});

						resolve(text);
					})
					.catch((error) => {
						const duration = performance.now() - startTime;
						const errorMessage =
							error instanceof Error ? error.message : String(error);

						this.executionSteps.push({
							action: "getText",
							selector,
							timestamp: startTime,
							duration,
							status: "error",
							error: errorMessage,
						});

						reject(error);
					});
			} catch (error) {
				reject(error);
			}
		});
	}

	getAttribute(
		selector: string,
		attribute: string,
		options?: { timeout?: number },
	): Promise<string | null> {
		return new Promise((resolve, reject) => {
			const startTime = performance.now();
			try {
				this.waitForCondition(
					() => !!document.querySelector(selector),
					options?.timeout,
				)
					.then(() => {
						const element = document.querySelector(selector);
						const value = element?.getAttribute(attribute) ?? null;
						const duration = performance.now() - startTime;

						if (selector)
							this.executionSteps.push({
								action: "getAttribute",
								selector,
								value,
								timestamp: startTime,
								duration,
								status: "success",
							});

						resolve(value);
					})
					.catch((error) => {
						const duration = performance.now() - startTime;
						const errorMessage =
							error instanceof Error ? error.message : String(error);

						this.executionSteps.push({
							action: "getAttribute",
							selector,
							timestamp: startTime,
							duration,
							status: "error",
							error: errorMessage,
						});

						reject(error);
					});
			} catch (error) {
				reject(error);
			}
		});
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
		const startTime = performance.now();
		this.executionSteps = [];

		try {
			for (const action of this.actions) {
				await action();
			}

			const totalDuration = performance.now() - startTime;

			const report: ExecutionReport = {
				totalDuration,
				steps: this.executionSteps,
				success: true,
			};

			if (this.config.debug) {
				console.log("[Orchflow] Execution completed successfully", report);
			}

			return report;
		} catch (error) {
			const totalDuration = performance.now() - startTime;
			const errorMessage =
				error instanceof Error ? error.message : String(error);

			const report: ExecutionReport = {
				totalDuration,
				steps: this.executionSteps,
				success: false,
				error: errorMessage,
			};

			if (this.config.debug) {
				console.error("[Orchflow] Execution failed", report);
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
}
