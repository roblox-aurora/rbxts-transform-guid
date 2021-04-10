import chalk from "chalk";
import ts from "typescript";
import { GuidTransformConfiguration } from ".";
import { isModule } from "./isModuleImportExpression";
import transformGuidsMacro from "./macro/guids";
import { formatTransformerDebug, formatTransformerDiagnostic } from "./shared";

export const MacroFunctionName = {
	guids: "$guids",
} as const;

function handleGuidCallExpression(
	node: ts.CallExpression,
	functionName: string,
	program: ts.Program,
	configuration: GuidTransformConfiguration,
): ts.Node {
	if (configuration.verbose)
		console.log(formatTransformerDebug("Handling call to macro " + chalk.yellow(functionName), node));

	switch (functionName) {
		case MacroFunctionName.guids:
			return transformGuidsMacro(node, program, configuration);
		default:
			throw formatTransformerDiagnostic(
				`function ${chalk.yellow(functionName)} cannot be handled by this version of rbxts-transform-debug`,
			);
	}
}

export function getModuleCallName(
	node: ts.CallExpression,
	program: ts.Program,
	config: GuidTransformConfiguration,
): string | undefined {
	const typeChecker = program.getTypeChecker();
	const signature = typeChecker.getResolvedSignature(node);
	if (!signature) {
		return;
	}
	const { declaration } = signature;
	if (!declaration || ts.isJSDocSignature(declaration) || !isModule(declaration.getSourceFile())) {
		return;
	}

	const functionName = declaration.name && declaration.name.getText();
	if (!functionName) {
		return;
	}

	return functionName;
}

export function visitCallExpression(node: ts.CallExpression, program: ts.Program, config: GuidTransformConfiguration) {
	const typeChecker = program.getTypeChecker();
	const signature = typeChecker.getResolvedSignature(node);
	if (!signature) {
		return node;
	}
	const { declaration } = signature;
	if (!declaration || ts.isJSDocSignature(declaration) || !isModule(declaration.getSourceFile())) {
		return node;
	}

	const functionName = declaration.name && declaration.name.getText();
	if (!functionName) {
		return node;
	}

	return handleGuidCallExpression(node, functionName, program, config);
}
