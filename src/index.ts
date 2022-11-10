/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import ts from "typescript";
import { TransformConfiguration, TransformState } from "./class/transformState";
import { transformFile } from "./transform/transformFile";
import { LoggerProvider } from "./class/logProvider";

const DEFAULTS: TransformConfiguration = {
	verbose: false,
	generateEnumUUIDs: true,
	generationType: "hashids",
	environments: ["production"],
};

export default function transform(program: ts.Program, userConfiguration: TransformConfiguration) {
	const currentEnvironment = process.env.NODE_ENV ?? "production";

	userConfiguration = { ...DEFAULTS, ...userConfiguration };
	userConfiguration.generateEnumUUIDs = userConfiguration.generateEnumUUIDs && userConfiguration.environments.includes(currentEnvironment);

	if (process.argv.includes("--verbose")) {
		userConfiguration.verbose = true;
	}

	const logger = new LoggerProvider(userConfiguration.verbose!, userConfiguration.verbose!);

	if (logger.verbose) {
		logger.write("\n");
	}
	
	return (context: ts.TransformationContext): ((file: ts.SourceFile) => ts.Node) => {
		
		const state = new TransformState(program, context, userConfiguration, logger);

		if (!userConfiguration.generateEnumUUIDs && !state.symbolProvider.moduleFile) {
			logger.warnIfVerbose("Skipped GUID transformer");
			return file => file;
		} else {
			logger.infoIfVerbose("Loaded GUID transformer");
		}

		return (file: ts.SourceFile) => {
			let printFile = false;

			const leading = ts.getLeadingCommentRanges(file.getFullText(), 0);
			if (leading) {
				const metaComment = "// @rbxts-transform-guid";

				const srcFileText = file.getFullText();
				for (const leadingComment of leading) {
					const comment = srcFileText.substring(leadingComment.pos, leadingComment.end);
					if (comment.startsWith(metaComment)) {
						const metaTags = comment.substring(metaComment.length + 1).split(" ");
						if (metaTags.includes("debug:print_file")) {
							printFile = true;
						}
						break;
					}
				}
			}

			const result = transformFile(state, file);

			if (printFile) {
				const printer = ts.createPrinter({});
				console.log(printer.printFile(result));
			}

			return result;
		};
	};
}
