/* eslint-disable @typescript-eslint/no-unused-vars */
type $ConstGuids<K extends string, T> = { readonly [P in keyof T]: `UUID@${K}:${P & string}` };
// export function $guids<K extends string, T extends Record<string, true>>(namespace: K, values: T): $ConstGuids<K, T>;
// export function $uuid(templateStr: TemplateStringsArray);

/**
 * Creates a debug object for UUIDs, for returning the original value of the UUID generated enum.
 */
export function $debugUUIDs<_TConstEnum>(): Record<string, string | undefined>;
