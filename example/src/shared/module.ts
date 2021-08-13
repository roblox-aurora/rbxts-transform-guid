import { $debugUUIDs } from "../../..";
import Net from "@rbxts/net";

/**
 * @uuid
 */
export const enum Test {
	Hi = "there",
	Hi2 = "There2!!",
	Hi3 = "hi2"
}

const uuids = $debugUUIDs<Test>();
print(uuids[Test.Hi], uuids.test)