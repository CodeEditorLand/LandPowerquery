// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as PQP from "@microsoft/powerquery-parser";
import { DocumentSymbol, SymbolKind } from "vscode-languageserver-types";

import * as Common from "./common";
import { SignatureProviderContext } from "./providers";

export function getContextForInvokeExpression(
    expression: PQP.Inspection.InvokeExpression,
): SignatureProviderContext | undefined {
    const functionName: string | undefined = expression.maybeName;
    if (functionName) {
        let argumentOrdinal: number | undefined;
        if (expression.maybeArguments) {
            argumentOrdinal = expression.maybeArguments.positionArgumentIndex;
        }

        return {
            argumentOrdinal,
            functionName,
        };
    }

    return undefined;
}

export function getCurrentNodeAsInvokeExpression(
    inspected: PQP.Inspection.Inspected,
): PQP.Inspection.InvokeExpression | undefined {
    if (inspected.nodes.length > 0) {
        const node: PQP.Inspection.TNode = inspected.nodes[0];
        if (node.kind === PQP.Inspection.NodeKind.InvokeExpression) {
            return node;
        }
    }

    return undefined;
}

export function getSymbolKindForLiteralExpression(node: PQP.Ast.LiteralExpression): SymbolKind {
    switch (node.literalKind) {
        case PQP.Ast.LiteralKind.List:
            return SymbolKind.Array;

        case PQP.Ast.LiteralKind.Logical:
            return SymbolKind.Boolean;

        case PQP.Ast.LiteralKind.Null:
            return SymbolKind.Null;

        case PQP.Ast.LiteralKind.Numeric:
            return SymbolKind.Number;

        case PQP.Ast.LiteralKind.Record:
            return SymbolKind.Struct;

        case PQP.Ast.LiteralKind.Str:
            return SymbolKind.String;

        default:
            return PQP.isNever(node.literalKind);
    }
}

export function getSymbolKindFromExpression(node: PQP.Ast.INode): SymbolKind {
    switch (node.kind) {
        case PQP.Ast.NodeKind.Constant:
            return SymbolKind.Constant;

        case PQP.Ast.NodeKind.FunctionExpression:
            return SymbolKind.Function;

        case PQP.Ast.NodeKind.ListExpression:
            return SymbolKind.Array;

        case PQP.Ast.NodeKind.LiteralExpression:
            return getSymbolKindForLiteralExpression(node as PQP.Ast.LiteralExpression);

        case PQP.Ast.NodeKind.MetadataExpression:
            return SymbolKind.TypeParameter;

        case PQP.Ast.NodeKind.RecordExpression:
            return SymbolKind.Struct;

        default:
            return SymbolKind.Variable;
    }
}

export function getSymbolsForLetExpression(expressionNode: PQP.Ast.LetExpression): DocumentSymbol[] {
    const documentSymbols: DocumentSymbol[] = [];

    for (const element of expressionNode.variableList.elements) {
        const pairedExpression: PQP.Ast.ICsv<PQP.Ast.IdentifierPairedExpression> = element;
        const memberSymbol: DocumentSymbol = getSymbolForIdentifierPairedExpression(pairedExpression.node);
        documentSymbols.push(memberSymbol);
    }

    return documentSymbols;
}

export function getSymbolsForSection(sectionNode: PQP.Ast.Section): DocumentSymbol[] {
    const documentSymbols: DocumentSymbol[] = [];

    for (const member of sectionNode.sectionMembers.elements) {
        const memberSymbol: DocumentSymbol = getSymbolForIdentifierPairedExpression(member.namePairedExpression);
        documentSymbols.push(memberSymbol);
    }

    return documentSymbols;
}

export function getSymbolForIdentifierPairedExpression(
    identifierPairedExpressionNode: PQP.Ast.IdentifierPairedExpression,
): DocumentSymbol {
    return {
        kind: getSymbolKindFromExpression(identifierPairedExpressionNode.value),
        deprecated: false,
        name: identifierPairedExpressionNode.key.literal,
        range: Common.tokenRangeToRange(identifierPairedExpressionNode.tokenRange),
        selectionRange: Common.tokenRangeToRange(identifierPairedExpressionNode.key.tokenRange),
    };
}
