import { useOrchflow } from "../../dist";

export function App() {
	const { execute } = useOrchflow();
	return (
		<button
			onClick={() => {
				execute((o) => o);
			}}
			type="button"
		>
			test
		</button>
	);
}
