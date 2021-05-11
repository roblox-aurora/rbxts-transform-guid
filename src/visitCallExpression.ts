import chalk from "chalk";
import ts, { factory } from "typescript";
import { GuidTransformConfiguration } from ".";
import { isModule } from "./isModuleImportExpression";
import transformGuidsMacro from "./macro/guids";
import { getGuidForLabel, updateGuidForLabel } from "./registry";
import { formatTransformerDebug, formatTransformerDiagnostic, formatTransformerWarning } from "./shared";

export const MacroFunctionName = {
	guids: "$guids",
	debugUUIDs: "$debugUUIDs",
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
		case MacroFunctionName.debugUUIDs: {
			if (node.typeArguments) {
				const [enumerable] = node.typeArguments;
				if (enumerable && ts.isTypeReferenceNode(enumerable)) {
					const typeChecker = program.getTypeChecker();
					const declaration = typeChecker.getTypeAtLocation(enumerable).getSymbol()?.valueDeclaration;

					if (
						declaration &&
						ts.isEnumDeclaration(declaration) &&
						declaration.modifiers?.findIndex((f) => f.kind === ts.SyntaxKind.ConstKeyword) !== -1
					) {
						const labelId = `${node.getSourceFile().fileName}:const-enum@${declaration.name.text}`;
						return factory.createObjectLiteralExpression(
							declaration.members.map((m) => {
								return factory.createPropertyAssignment(
									factory.createStringLiteral(
										configuration.EXPERIMENTAL_JSDocConstEnumUUID
											? getGuidForLabel(`${labelId}:${m.name.getText()}`)
											: m.initializer && ts.isStringLiteral(m.initializer)
											? m.initializer.text
											: "",
									),
									factory.createStringLiteral(m.name.getText()),
								);
							}),
						);
					}
				}
			}

			throw formatTransformerDiagnostic(
				`${MacroFunctionName.debugUUIDs} expects a type reference to a const enum.`,
				node,
			);
		}
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
