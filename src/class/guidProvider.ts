import { v4 } from "uuid";
import Hashids from "hashids";
import { TransformState, UUIDGenerationType } from "./transformState";

const hashids = new Hashids()

function getRndInteger(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateGuid() {
  const len = getRndInteger(5, 16);
  const iterations = getRndInteger(2, 5);
  let value = "";

  for (let i = 0; i < iterations; i++) {
    value += Math.random().toString(36).substring(2, len);
  }

  const noNumbers = value.replace(/[0-9]/g, "");
  const randomCaps = noNumbers
    .toLowerCase()
    .split("")
    .map(function (c) {
      return Math.random() < 0.85 ? c : c.toUpperCase();
    })
    .join("");

  return randomCaps;
}

export class GUIDProvider {
  private labels = new Map<string, string>();

  public constructor(private readonly transformState: TransformState) {}

  public hasStringForConstLabel(label: string) {
    return this.labels.has(label);
  }

  public getStringForConstLabel(
    label: string,
    labelKind: UUIDGenerationType
  ): string {
    if (this.labels.has(label)) {
      return this.labels.get(label)!;
    } else {
      if (labelKind === "guidv4") {
        const uuid = v4();
        this.labels.set(label, uuid);
        return uuid;
      } else if (labelKind === "string") {
        const uuid = generateGuid();
        this.labels.set(label, uuid);
        return uuid;
      } else if (labelKind === "hashid") {
        const uuid = hashids.encode(this.labels.size, new Date().getTime());
        this.labels.set(label, uuid);
        return uuid;
      } else {
        throw `Unsupported`;
      }
    }
  }
}
