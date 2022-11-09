/* eslint-disable @typescript-eslint/no-non-null-assertion */
import chalk from "chalk";
import path from "path";
import ts, { factory } from "typescript";
import { TransformState, UUIDGenerationType } from "../class/transformState";
import { transformNode } from "./transformNode";

export function transformShortcutIfLiterals(
  state: TransformState,
  node: ts.Statement
): ts.Statement {
  if (
    ts.isEnumDeclaration(node) &&
    node.modifiers?.find((f) => f.kind === ts.SyntaxKind.ConstKeyword)
  ) {
    const guidProvider = state.guidProvider;

    const docTags = ts.getJSDocTags(node);

    for (const tag of docTags) {
      if (tag.tagName.text === "uuid") {
        let generationType = state.config.generationType;
        if (
          typeof tag.comment === "string" &&
          ["string", "guidv4", "hashid"].includes(tag.comment)
        ) {
          generationType = tag.comment as UUIDGenerationType;
        }

        state.logger.infoIfVerbose(
          `Transforming detected UUID enumerable object ${chalk.green(
            path.relative(state.options.baseUrl!, node.getSourceFile().fileName)
          )}: ${chalk.yellow(node.name.text)}`
        );

        const labelId = `${node.getSourceFile().fileName}:const-enum@${
          node.name.text
        }`;

        if (!guidProvider.hasStringForConstLabel(labelId)) {
          const parentLabel = guidProvider.getStringForConstLabel(
            labelId,
            generationType
          );

          return factory.updateEnumDeclaration(
            node,
            undefined,
            node.modifiers,
            node.name,
            node.members.map((m) => {
              return factory.updateEnumMember(
                m,
                m.name,
                factory.createStringLiteral(
                  guidProvider.getStringForConstLabel(
                    `${parentLabel}:${m.name.getText()}`,
                    generationType
                  )
                )
              );
            })
          );
        }
      }
    }
  }

  return node;
}

export function transformStatement(
  state: TransformState,
  statement: ts.Statement
): ts.Statement {
  return transformShortcutIfLiterals(
    state,
    ts.visitEachChild(
      statement,
      (newNode) => transformNode(state, newNode),
      state.context
    )
  );
}
