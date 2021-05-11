/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import ts, { factory } from "typescript";
import { formatTransformerDebug, formatTransformerWarning } from "./shared";
import { visitCallExpression } from "./visitCallExpression";
import { isModuleImportExpression } from "./isModuleImportExpression";
import visitVariableStatement from "./visitVariableDeclaration";
import { getGuidForLabel, hasGuidForLabel, updateGuidForLabel } from "./registry";

function visitNode(node: ts.SourceFile, program: ts.Program, config: GuidTransformConfiguration): ts.SourceFile;
function visitNode(node: ts.Node, program: ts.Program, config: GuidTransformConfiguration): ts.Node | undefined;
function visitNode(
	node: ts.Node,
	program: ts.Program,
	config: GuidTransformConfiguration,
): ts.Node | ts.Node[] | undefined {
	if (isModuleImportExpression(node, program)) {
		const { importClause } = node;

		if (importClause !== undefined && importClause.isTypeOnly) {
			return node;
		}

		return factory.createExportDeclaration(
			undefined,
			undefined,
			false,
			ts.factory.createNamedExports([]),
			undefined,
		);
	}

	if (ts.isStringLiteral(node)) {
		if (node.text.startsWith("UUID@")) {
			const uuid = node.text.substr(5);
			console.log(uuid);
			const label = getGuidForLabel(uuid);
			return factory.createStringLiteral(label);
		}
	}

	if (ts.isEnumDeclaration(node) && config.EXPERIMENTAL_JSDocConstEnumUUID) {
		const tags = ts.getJSDocTags(node);
		if (tags.length > 0) {
			//console.log(tags.map((d) => d.getText()));
			for (const tag of tags) {
				if (tag.tagName.text === "uuid") {
					if (
						node.modifiers &&
						node.modifiers.findIndex((f) => f.kind === ts.SyntaxKind.ConstKeyword) !== -1
					) {
						const labelId = `${node.getSourceFile().fileName}:const-enum@${node.name.text}`;
						// Check for our label
						if (hasGuidForLabel(labelId)) {
							if (config.ConstEnumForceIfWatch) {
								updateGuidForLabel(labelId);
							} else {
								console.log(
									formatTransformerWarning(
										`Detected existing UUID for node ${labelId}, disabled UUID generation. To force, use 'ConstEnumForceIfWatch'`,
									),
								);
								continue;
							}
						} else {
							getGuidForLabel(labelId);
						}

						if (config.verbose) {
							console.log(formatTransformerDebug("Transform node enum values", node));
						}
						return factory.updateEnumDeclaration(
							node,
							undefined,
							node.modifiers,
							node.name,
							node.members.map((m) => {
								return factory.updateEnumMember(
									m,
									m.name,
									factory.createStringLiteral(updateGuidForLabel(`${labelId}:${m.name.getText()}`)),
								);
							}),
						);
					} else {
						console.log(formatTransformerWarning("Found '@uuid' on node, but not ambient enum", node));
					}
				}
			}
		}
	}

	if (ts.isVariableStatement(node)) {
		return visitVariableStatement(node, program, config);
	}

	if (ts.isCallExpression(node)) {
		return visitCallExpression(node, program, config);
	}

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
	EXPERIMENTAL_JSDocConstEnumUUID: boolean;
	ConstEnumUUIDRequiresEnv?: Record<string, string | boolean | string[]> | Array<string>;
	ConstEnumForceIfWatch?: boolean;
}

const DEFAULTS: GuidTransformConfiguration = {
	useConstEnum: false,
	EXPERIMENTAL_JSDocConstEnumUUID: false,
	ConstEnumUUIDRequiresEnv: ["production"],
};

export default function transform(program: ts.Program, userConfiguration: GuidTransformConfiguration) {
	userConfiguration = { ...DEFAULTS, ...userConfiguration };
	const { ConstEnumUUIDRequiresEnv: ambientEmitIfEnv } = userConfiguration;

	if (userConfiguration.verbose) {
		// eslint-disable-next-line @typescript-eslint/no-var-requires
		console.log(formatTransformerDebug("Running version " + require("../package.json").version));
	}

	if (ambientEmitIfEnv) {
		if (Array.isArray(ambientEmitIfEnv)) {
			const envVar = (process.env["NODE_ENV"] ?? "").trim();
			let enableAmbient = false;

			if (userConfiguration.verbose) {
				console.log(formatTransformerDebug("Check environment variable NODE_ENV against " + envVar));
			}

			for (const v of ambientEmitIfEnv) {
				if (v === envVar) {
					enableAmbient = true;
				}
			}

			userConfiguration.EXPERIMENTAL_JSDocConstEnumUUID = enableAmbient;
		} else {
			for (const [k, v] of Object.entries(ambientEmitIfEnv)) {
				const envVar = process.env[k];
				if (userConfiguration.verbose) {
					console.log(
						formatTransformerDebug("Check environment variable " + k + " against " + envVar?.toString()),
					);
				}
				if (
					envVar &&
					((typeof v === "boolean" && envVar === undefined) ||
						(typeof v === "string" && envVar !== v) ||
						(Array.isArray(v) && v.includes(envVar)))
				) {
					userConfiguration.EXPERIMENTAL_JSDocConstEnumUUID = false;
				}
			}
		}
	}

	return (context: ts.TransformationContext) => (file: ts.SourceFile) =>
		visitNodeAndChildren(file, program, context, userConfiguration);
}
