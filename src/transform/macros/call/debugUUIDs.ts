import assert from "assert";
import chalk from "chalk";
import path from "path";
import ts, { factory, SyntaxKind } from "typescript";
import { TransformState } from "../../../class/transformState";
import { CallMacro } from "../macro";

export const DebugUUIDsMacro: CallMacro = {
  getSymbol(state: TransformState) {
    const envSymbol = state.symbolProvider.moduleFile?.debugUUIDs;
    assert(envSymbol, "Could not find debugUUIDs macro symbol");
    return envSymbol;
  },
  transform(state: TransformState, node: ts.CallExpression) {
    const typeArgs = node.typeArguments;
    if (typeArgs) {
      const [query] = typeArgs;
      if (ts.isTypeQueryNode(query)) {
        const typeSymbol = state.typeChecker.getSymbolAtLocation(
          query.exprName
        );
        if (typeSymbol && typeSymbol.declarations) {
          const [declaration] = typeSymbol.declarations;
          if (ts.isEnumDeclaration(declaration)) {
            const enabled = state.config.generateEnumUUIDs;

            state.logger.infoIfVerbose(
              `Create reverse lookup table for ${chalk.red(
                declaration.name.text
              )}@${chalk.green(
                path.relative(
                  state.baseDir,
                  declaration.getSourceFile().fileName
                )
              )} in ${chalk.green(
                path.relative(state.baseDir, node.getSourceFile().fileName)
              )}:${chalk.yellow(
                ts.getLineOfLocalPosition(node.getSourceFile(), node.pos)
              )}`
            );

            const members = declaration.members;

            const parentLabel = `${
              declaration.getSourceFile().fileName
            }:const-enum@${declaration.name.text}`;

            return factory.createAsExpression(
              factory.createObjectLiteralExpression(
                members.map((member) => {
                  const id = state.guidProvider.getStringForConstLabel(
                    `${parentLabel}:${member.name.getText()}`,
                    state.guidProvider.getGenerationTypeForEnum(declaration, state.config.generationType)!,
                  );

                  if (
                    member.initializer &&
                    ts.isStringLiteral(member.initializer)
                  ) {
                    return factory.createPropertyAssignment(
                      enabled ? factory.createStringLiteral(id) : member.initializer,
                      factory.createStringLiteral(member.name.getText())
                    );
                  } else {
                    return factory.createPropertyAssignment(
                      declaration.name.text,
                      factory.createIdentifier("undefined")
                    );
                  }
                })
              ),
              factory.createTypeReferenceNode(
                factory.createIdentifier("Record"),
                [
                  factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword),
                  factory.createUnionTypeNode([
                    factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword),
                    factory.createKeywordTypeNode(
                      ts.SyntaxKind.UndefinedKeyword
                    ),
                  ]),
                ]
              )
            );
          }
        }
      }
    }

    return factory.createIdentifier("undefined");
  },
};
