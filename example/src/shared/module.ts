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

// const testing = uuids.SomethingGoesHereLol;
uuids.test

// print(uuids[Test.Hi], uuids.test)


const test = Test.RemoteName1;
const uuid = uuids[Test.RemoteName1];