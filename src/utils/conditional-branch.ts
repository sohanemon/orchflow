import { Orchestrator } from "./orchestrator";

export class ConditionalBranch {
	private orchestrator: Orchestrator;
	private condition: () => boolean | Promise<boolean>;
	private thenActions: Array<() => Promise<void>> = [];
	private elseActions: Array<() => Promise<void>> = [];

	constructor(
		orchestrator: Orchestrator,
		condition: () => boolean | Promise<boolean>,
	) {
		this.orchestrator = orchestrator;
		this.condition = condition;
	}

	do(callback: (orch: Orchestrator) => Orchestrator): this {
		const tempOrch = new Orchestrator();
		callback(tempOrch);
		this.thenActions = tempOrch.getActions();
		return this;
	}

	else(callback: (orch: Orchestrator) => Orchestrator): Orchestrator {
		const tempOrch = new Orchestrator();
		callback(tempOrch);
		this.elseActions = tempOrch.getActions();

		// Add conditional execution to main orchestrator
		this.orchestrator.getActions().push(async () => {
			const conditionResult = await Promise.resolve(this.condition());

			if (conditionResult) {
				for (const action of this.thenActions) {
					await action();
				}
			} else {
				for (const action of this.elseActions) {
					await action();
				}
			}
		});

		return this.orchestrator;
	}
}
