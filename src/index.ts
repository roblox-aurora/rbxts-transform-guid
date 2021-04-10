/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import ts, { factory } from "typescript";
import { formatTransformerDebug } from "./shared";
import { visitCallExpression } from "./visitCallExpression";
import { isModuleImportExpression } from "./isModuleImportExpression";
import visitVariableStatement from "./visitVariableDeclaration";
import { getGuidForLabel } from "./registry";

function visitNode(node: ts.SourceFile, program: ts.Program, config: GuidTransformConfiguration): ts.SourceFile;
function visitNode(node: ts.Node, program: ts.Program, config: GuidTransformConfiguration): ts.Node | undefined;
function visitNode(
	node: ts.Node,
	program: ts.Program,
	config: GuidTransformConfiguration,
): ts.Node | ts.Node[] | undefined {
	// if (isModuleImportExpression(node, program)) {
	// 	const { importClause } = node;

	// 	if (importClause !== undefined && importClause.isTypeOnly) {
	// 		return node;
	// 	}

	// 	return factory.createExportDeclaration(
	// 		undefined,
	// 		undefined,
	// 		false,
	// 		ts.factory.createNamedExports([]),
	// 		undefined,
	// 	);
	// }

	if (ts.isEnumDeclaration(node)) {
		const tags = ts.getJSDocTags(node);
		if (node.modifiers && node.modifiers?.findIndex((f) => f.kind === ts.SyntaxKind.ConstKeyword) !== -1) {
			//console.log(tags.map((d) => d.getText()));
			for (const tag of tags) {
				if (tag.tagName.text === "uuid") {
					return factory.updateEnumDeclaration(
						node,
						undefined,
						node.modifiers,
						node.name,
						node.members.map((m) => {
							return factory.updateEnumMember(
								m,
								m.name,
								factory.createStringLiteral(getGuidForLabel(m.name.getText())),
							);
						}),
					);
				}
			}
		}
	}

	// if (ts.isVariableStatement(node)) {
	// 	return visitVariableStatement(node, program, config);
	// }

	// if (ts.isCallExpression(node)) {
	// 	return visitCallExpression(node, program, config);
	// }

	return node;
}

function visitNodeAndChildren(
	node: ts.SourceFile,
	program: ts.Program,
	context: ts.TransformationContext,
	config: GuidTransformConfiguration,
): ts.SourceFile;
function visitNodeAndChildren(
	node: ts.Node,
	program: ts.Program,
	context: ts.TransformationContext,
	config: GuidTransformConfiguration,
): ts.Node | undefined;
function visitNodeAndChildren(
	node: ts.Node,
	program: ts.Program,
	context: ts.TransformationContext,
	config: GuidTransformConfiguration,
): ts.Node | undefined {
	return ts.visitEachChild(
		visitNode(node, program, config),
		(childNode) => visitNodeAndChildren(childNode, program, context, config),
		context,
	);
}

export interface GuidTransformConfiguration {
	verbose?: boolean;
	useConstEnum?: boolean;
}

const DEFAULTS: GuidTransformConfiguration = {
	useConstEnum: true,
};

export default function transform(program: ts.Program, userConfiguration: GuidTransformConfiguration) {
	userConfiguration = { ...DEFAULTS, ...userConfiguration };

	if (userConfiguration.verbose) {
		// eslint-disable-next-line @typescript-eslint/no-var-requires
		console.log(formatTransformerDebug("Running version " + require("../package.json").version));
	}

	return (context: ts.TransformationContext) => (file: ts.SourceFile) =>
		visitNodeAndChildren(file, program, context, userConfiguration);
}
