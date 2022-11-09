// @rbxts-transform-guid debug:print_file
import { $debugUUIDs } from "rbxts-transform-guid";

/**
 * @uuid hashids
 */
export const enum Test {
  RemoteName1 = "SomethingGoesHereLol",
  RemoteName2 = "AnotherThingGoesHere",
}

const uuids = $debugUUIDs<typeof Test>();
// type infer = {[P in keyof typeof Test]: string};

const testing = uuids.SomethingGoesHereLol;

// print(uuids[Test.Hi], uuids.test)


uuids[Test.RemoteName1];