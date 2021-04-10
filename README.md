GUID
=====
Very experimental compile-time GUID library


## Ambient Enum UUIDs

option `EXPERIMENTAL_JSDocConstEnumUUID`. If this is use, it must only be used in contexts where a file watcher isn't used such as production. Environments can be set with `ConstEnumUUIDRequiresEnv`.

```ts
/**
 * @uuid
 */
const enum AmbientId {
    Test = "Hello, World"
}
```

All it requires is a `const enum` and a `@uuid` jsdoc tag. This should only be used in production environments, and without watch mode. If used in watch mode this may be quite buggy and cause issues.