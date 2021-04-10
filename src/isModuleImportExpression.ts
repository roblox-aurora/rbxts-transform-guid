import path from "path";
import ts from "typescript";
import fs from "fs";

const sourceText = fs.readFileSync(path.join(__dirname, "..", "index.d.ts"), "utf8");
export function isModule(sourceFile: ts.SourceFile) {
	return sourceFile.text === sourceText;
}

export function isModuleImportExpression(node: ts.Node, program: ts.Program): node is ts.ImportDeclaration {
	if (!ts.isImportDeclaration(node)) {
		return false;
	}

	if (!node.importClause) {
		return false;
	}

	const namedBindings = node.importClause.namedBindings;
	if (!node.importClause.name && !namedBindings) {
		return false;
	}

	const importSymbol = program.getTypeChecker().getSymbolAtLocation(node.moduleSpecifier);

	if (!importSymbol || !isModule(importSymbol.valueDeclaration.getSourceFile())) {
		return false;
	}

	return true;
}