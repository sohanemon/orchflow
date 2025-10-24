import { useOrchflow } from "../../dist";

export function App() {
	const { execute } = useOrchflow();
	return (
		<button
			onClick={() => {
				// execute((o) => o.getAttribute("es", "es"));
				execute(function (o) {
					return o.getText("s");
				});
			}}
			type="button"
		>
			test
		</button>
	);
}
