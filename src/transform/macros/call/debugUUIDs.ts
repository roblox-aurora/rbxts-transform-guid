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
            state.logger.infoIfVerbose(
              `Create reverse lookup table for ${chalk.red(
                declaration.name.text
              )} in ${chalk.green(
                path.relative(state.baseDir, node.getSourceFile().fileName)
              )}:${chalk.yellow(
                ts.getLineOfLocalPosition(node.getSourceFile(), node.pos)
              )}`
            );

            const members = declaration.members;
            const interfaceType = factory.createUniqueName(
              declaration.name.text
            );

            const parentLabel = `${
              declaration.getSourceFile().fileName
            }:const-enum@${declaration.name.text}`;

            state.prereq(
              factory.createInterfaceDeclaration(
                undefined,
                interfaceType,
                undefined,
                undefined,
                members.map((member) => {
                  const id = state.guidProvider.getStringForConstLabel(
                    `${parentLabel}:${member.name.getText()}`,
                    state.config.generationType
                  );

                  if (
                    member.initializer &&
                    ts.isStringLiteral(member.initializer)
                  ) {
                    return factory.createPropertySignature(
                      undefined,
                      factory.createStringLiteral(member.initializer.text),
                      undefined,
                      factory.createLiteralTypeNode(
                        factory.createStringLiteral(id)
                      )
                    );
                  } else {
                    return factory.createPropertySignature(
                      undefined,
                      member.name,
                      undefined,
                      factory.createKeywordTypeNode(
                        ts.SyntaxKind.UnknownKeyword
                      )
                    );
                  }
                })
              )
            );

            return factory.createAsExpression(
              factory.createObjectLiteralExpression(
                members.map((member) => {
                  const id = state.guidProvider.getStringForConstLabel(
                    `${parentLabel}:${member.name.getText()}`,
                    state.config.generationType
                  );

                  if (
                    member.initializer &&
                    ts.isStringLiteral(member.initializer)
                  ) {
                    return factory.createPropertyAssignment(
                      member.initializer.text,
                      factory.createStringLiteral(id)
                    );
                  } else {
                    return factory.createPropertyAssignment(
                      declaration.name.text,
                      factory.createIdentifier("undefined")
                    );
                  }
                })
              ),
              factory.createTypeReferenceNode(interfaceType)
            );
          }
        }
      }
    }

    return factory.createIdentifier("undefined");
  },
};
