/** biome-ignore-all lint/correctness/useUniqueElementIds: test */

import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Orchflow } from "../src";

describe("Orchflow", () => {
	let container: HTMLElement;

	beforeEach(() => {
		document.body.innerHTML = "";
		container = document.createElement("div");
		document.body.appendChild(container);
	});

	it("should execute a simple click action", async () => {
		const handleClick = vi.fn();
		render(<button onClick={handleClick}>Click me</button>);

		const orch = new Orchflow({ debug: true });
		await orch.click("button").execute();

		expect(handleClick).toHaveBeenCalledTimes(1);
	});

	it("should fill input value", async () => {
		render(<input />);
		const orch = new Orchflow();
		await orch.fill("input", "Hello").execute();
		const input = document.querySelector("input") as HTMLInputElement;
		expect(input.value).toBe("Hello");
	});

	it("should type characters with delay", async () => {
		render(<input />);

		const orch = new Orchflow();
		await orch.type("input", "abc", { delay: 1 }).execute();

		const input = document.querySelector("input") as HTMLInputElement;
		expect(input.value).toBe("abc");
	});

	it("should clear an input", async () => {
		render(<input defaultValue="something" />);

		const orch = new Orchflow();
		await orch.clear("input").execute();

		const input = document.querySelector("input") as HTMLInputElement;
		expect(input.value).toBe("");
	});

	it("should hover an element", async () => {
		const handleHover = vi.fn();
		render(<button onMouseOver={handleHover}>Hover</button>);

		const orch = new Orchflow();
		await orch.hover("button").execute();

		expect(handleHover).toHaveBeenCalled();
	});

	it("should select a value from a <select>", async () => {
		render(
			<select>
				<option value="a">A</option>
				<option value="b">B</option>
			</select>,
		);

		const orch = new Orchflow();
		await orch.select("select", "b").execute();

		const select = document.querySelector("select") as HTMLSelectElement;
		expect(select.value).toBe("b");
	});

	it("should simulate key press", async () => {
		const handler = vi.fn();
		document.addEventListener("keydown", handler);

		const orch = new Orchflow();
		await orch.press("Enter").execute();

		expect(handler).toHaveBeenCalledWith(
			expect.objectContaining({ key: "Enter" }),
		);
	});

	it("should wait for element to appear", async () => {
		const orch = new Orchflow();

		setTimeout(() => {
			const el = document.createElement("div");
			el.className = "lazy";
			document.body.appendChild(el);
		}, 50);

		await orch.waitFor(".lazy", { timeout: 500 }).execute();

		expect(document.querySelector(".lazy")).not.toBeNull();
	});

	it("should wait for text in body", async () => {
		const orch = new Orchflow();

		setTimeout(() => {
			document.body.textContent = "Magic text here";
		}, 50);

		await orch.waitForText("Magic text", { timeout: 500 }).execute();
		expect(document.body.textContent).toContain("Magic text");
	});

	it("should wait for attribute value", async () => {
		const el = document.createElement("div");
		el.id = "target";
		document.body.appendChild(el);

		setTimeout(() => {
			el.setAttribute("data-state", "ready");
		}, 50);

		const orch = new Orchflow();
		await orch
			.waitForAttribute("#target", "data-state", "ready", { timeout: 500 })
			.execute();

		expect(el.getAttribute("data-state")).toBe("ready");
	});

	it("should assert element visibility", async () => {
		render(<div style={{ display: "block" }}>Visible</div>);

		const orch = new Orchflow();
		await orch.assert("div", { visible: true }).execute();
	});

	it("should assert element non-existence", async () => {
		const orch = new Orchflow();
		await orch.assert("#does-not-exist", { exists: false }).execute();
	});

	it("should throw error on failed assertion", async () => {
		render(<div>Wrong Text</div>);
		const orch = new Orchflow();
		await expect(
			orch.assert("div", { text: "Right Text" }).execute(),
		).rejects.toThrow();
	});

	it("should get text content", async () => {
		render(<p>Hello Orchflow</p>);
		const orch = new Orchflow();
		await orch.getText("p").execute();
		expect(document.querySelector("p")?.textContent).toBe("Hello Orchflow");
	});

	it("should respect delayBetweenActions", async () => {
		const delaySpy = vi.spyOn(global, "setTimeout");
		render(<button>Click</button>);

		const orch = new Orchflow({ delayBetweenActions: 50 });
		await orch.click("button").click("button").execute();

		expect(delaySpy).toHaveBeenCalledWith(expect.any(Function), 50);
		delaySpy.mockRestore();
	});

	it("should handle abort properly", async () => {
		const orch = new Orchflow();

		const action = orch.waitFor(".never", { timeout: 1000 });
		setTimeout(() => orch.abort(), 50);

		await expect(action.execute()).rejects.toThrow("Orchestration aborted");
	});

	it("should record execution steps and report success", async () => {
		render(<button>Click</button>);

		const orch = new Orchflow();
		const report = await orch.click("button").execute();

		expect(report.success).toBe(true);
		expect(report.steps.length).toBeGreaterThan(0);
	});

	it("should handle errors gracefully and throw", async () => {
		const orch = new Orchflow();
		await expect(
			orch.click("#not-found", { timeout: 50 }).execute(),
		).rejects.toThrow();
	});

	it("should support chaining multiple actions", async () => {
		render(
			<>
				<input id="a" />
				<button id="b">B</button>
			</>,
		);

		const orch = new Orchflow();
		await orch.fill("#a", "X").click("#b").execute();

		expect((document.querySelector("#a") as HTMLInputElement).value).toBe("X");
	});

	it("should allow conditional branching (if/else)", async () => {
		render(<button id="yes">Yes</button>);

		const orch = new Orchflow();
		await orch
			.if(() => true)
			.do((f) => f.click("#yes"))
			.else((f) => f.click("#no"))
			.execute();

		expect(document.querySelector("#yes")).not.toBeNull();
	});

	it("should destroy and clear all actions", () => {
		const orch = new Orchflow();
		orch.click("div");
		expect(orch.getActions().length).toBe(1);

		orch.destroy();
		expect(orch.getActions().length).toBe(0);
	});
});
