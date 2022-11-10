import ts, { factory } from "typescript";
import { TransformState } from "../../class/transformState";
import { transformNode } from "../transformNode";

export function transformBinaryExpression(state: TransformState, node: ts.BinaryExpression): ts.Expression {
	return ts.visitEachChild(node, (node) => transformNode(state, node), state.context);
}
