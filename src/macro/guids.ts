import ts, { factory } from "typescript";
import { GuidTransformConfiguration } from "..";
import { formatTransformerDebug, formatTransformerDiagnostic } from "../shared";

export default function transformGuidsMacro(
	node: ts.CallExpression,
	program: ts.Program,
	config: GuidTransformConfiguration,
): ts.Node {
	const [namespace, values] = node.arguments;

	if (!ts.isStringLiteral(namespace)) {
		throw formatTransformerDiagnostic("Namespace should be a string literal!", namespace);
	}

	if (!ts.isObjectLiteralExpression(values)) {
		throw formatTransformerDiagnostic("values should be an object literal", values);
	}

    throw formatTransformerDiagnostic("NO");

	// if (ts.isVariableDeclaration(node.parent) && ts.isVariableStatement(node.parent.parent.parent)) {
	// 	if (config.verbose) {
	// 		console.log(formatTransformerDebug("Node parent is variable declaration", node.parent));
	// 	}

	// 	const {
	// 		parent: { name },
	// 	} = node;

	// 	const statement = node.parent.parent.parent;
	// 	const type = statement.modifiers;

	// 	return factory.createEnumDeclaration(undefined, [], "Test" + name.getText(), []);
	// } else {
	// 	return factory.createEnumDeclaration(undefined, undefined, "test2", []);
	// }

	return node;
}
