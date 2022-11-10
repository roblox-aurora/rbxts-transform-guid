// @rbxts-transform-guid debug:print_file
import { $debugUUIDs } from "rbxts-transform-guid";

/**
 * @uuid hashids
 */
export const enum Test {
  RemoteName1 = "SomethingGoesHereLol",
  RemoteName2 = "AnotherThingGoesHere",
}

/**
 * @uuid guidv4
 */
export const enum GUIDs {
  GUID_A = "test",
  GUID_B = "test2",
}

/**
 * @uuid string
 */
export const enum RandomStrings {
  RANDOM_A = "A",
  RANDOM_B = "B",
}

const guids = [GUIDs.GUID_A, GUIDs.GUID_B, RandomStrings.RANDOM_A, RandomStrings.RANDOM_B];

const test = Test.RemoteName1;
const uuids = $debugUUIDs<typeof Test>();
const uuid = uuids[Test.RemoteName1];