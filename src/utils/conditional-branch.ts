import { Orchflow } from "./orchestrator";

export class ConditionalBranch {
	private orchestrator: Orchflow;
	private condition: () => boolean | Promise<boolean>;
	private thenActions: Array<() => Promise<void>> = [];
	private elseActions: Array<() => Promise<void>> = [];

	constructor(
		orchestrator: Orchflow,
		condition: () => boolean | Promise<boolean>,
	) {
		this.orchestrator = orchestrator;
		this.condition = condition;
	}

	do(callback: (orch: Orchflow) => Orchflow): this {
		const tempOrch = new Orchflow();
		callback(tempOrch);
		this.thenActions = tempOrch.getActions();
		return this;
	}

	else(callback: (orch: Orchflow) => Orchflow): Orchflow {
		const tempOrch = new Orchflow();
		callback(tempOrch);
		this.elseActions = tempOrch.getActions();

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
