import ts, { factory } from "typescript";
import { GuidTransformConfiguration } from ".";
import { isModule } from "./isModuleImportExpression";
import { getGuidForLabel } from "./registry";
import { formatTransformerDebug } from "./shared";
import { getModuleCallName, MacroFunctionName } from "./visitCallExpression";

export function transformAssignmentToEnum(
	modifiers: ts.ModifiersArray | undefined,
	name: string,
	namespace: string,
	values: ts.ObjectLiteralExpression,
	useConstEnum: boolean,
) {
	const props = new Array<ts.EnumMember>();
	console.log(values.kind);
	for (const prop of values.properties) {
		// if (ts.isStringLiteral(prop)) {
		if (prop.name !== undefined) {
			console.log(prop.name);
			props.push(
				factory.createEnumMember(
					prop.name,
					factory.createStringLiteral(getGuidForLabel(`${namespace}:${prop.name.getText()}`)),
				),
			);
			// }
		} else {
			console.log(prop.kind);
		}
	}

	return factory.createEnumDeclaration(
		undefined,
		useConstEnum ? [factory.createModifier(ts.SyntaxKind.ConstKeyword)] : [],
		name,
		props,
	);
}

export default function visitVariableStatement(
	node: ts.VariableStatement,
	program: ts.Program,
	config: GuidTransformConfiguration,
) {
	const {
		declarationList: { declarations },
		modifiers,
	} = node;

	if (declarations.length === 1) {
		const [declaration] = declarations;
		const { initializer, name } = declaration;
		if (initializer && ts.isCallExpression(initializer)) {
			const moduleCallName = getModuleCallName(initializer, program, config);
			if (moduleCallName) {
				switch (moduleCallName) {
					case MacroFunctionName.guids:
						const [namespace, values] = initializer.arguments;
						if (config.verbose) {
							console.log(formatTransformerDebug("Transform"));
						}

						if (!ts.isStringLiteral(namespace)) {
							throw ``;
						}

						if (ts.isObjectLiteralExpression(values)) {
							return transformAssignmentToEnum(
								modifiers,
								name.getText(),
								namespace.text,
								values,
								config.useConstEnum ?? false,
							);
						}
				}
			}
		}
	}

	return node;
}
