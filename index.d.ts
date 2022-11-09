/* eslint-disable @typescript-eslint/no-unused-vars */
type $ConstGuids<K extends string, T> = {
  readonly [P in keyof T]: `UUID@${K}:${P & string}`;
};
/**
 * Creates a debug object for UUIDs, for returning the original value of the UUID generated enum.
 */
export function $debugUUIDs<_TConstEnum>(): {
  [P in keyof _TConstEnum as _TConstEnum[P]]: _TConstEnum[P];
};
