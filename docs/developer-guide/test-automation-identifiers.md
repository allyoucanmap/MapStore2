# Test automation identifiers

End to end tests target elements through the `data-ms-id` attribute.

## One spelling per layer

| layer | spelling |
|---|---|
| rendered DOM attribute | `data-ms-id` |
| plugin configuration key | `dataMsId` |
| React prop | `dataMsId` |

`data-ms-id` is what a test selector matches. The input side is `dataMsId` because every property key in `configs/localConfig.json` is camelCase.

```jsx
// configuration
{ "id": "my-entry", "dataMsId": "my-identifier" }

// component
const MyButton = ({ dataMsId, ...props }) => <Button {...props} data-ms-id={dataMsId} />;
```

## The identifier is declared, not guessed

A component rendering items supplied by someone else must not infer what they are.
Only the declaring side knows the meaning.

```jsx
// wrong: the icon is a rendering detail, and it may change with state
const id = glyph === 'star' ? `${prefix}-bookmark` : null;

// right: whoever injects the item says what it is
<ItemComponent glyph={active ? 'star' : 'star-empty'} dataMsId={`${prefix}-bookmark`} />
```

| the element is | the identifier comes from |
|---|---|
| injected by a plugin into a container | the injecting plugin |
| described by plugin configuration | a `dataMsId` key on that entry |
| one of a set with stable ids in configuration | derived from that id, `dataMsId` overriding |
| rendered by the component itself | a literal in that component |

Deriving covers every item without configuring anything, and still allows an override:

```jsx
const getDataMsId = (item = {}) => item.dataMsId ?? (item.id ? `my-feature-${item.id}` : undefined);
```

## Never derive from an unstable source

An identifier must survive a restyle, a translation update and a re-sort.

| source | why it breaks |
|---|---|
| a glyph name | the icon is a rendering detail and can be state dependent |
| a free text label | it changes with the UI language |
| a message id | it couples the identifier to the i18n keys, and leaks their dots and prefixes |
| a list index | it names a position, so identifiers shift on sort, filter and paging |

Use the thing's own identity: a configuration `id`, a resource id, or a property name.

## Write it as a plain JSX attribute

`data-ms-id="value"` is valid JSX and passes `react/no-unknown-property`, which does not check `data-*`.

```jsx
// wrong
<button {...{ 'data-ms-id': 'my-button' }} />
<button {...(id ? { 'data-ms-id': id } : {})} />

// right
<button data-ms-id="my-button" />
<button data-ms-id={id} />
```

React omits an attribute whose value is `undefined`. Keep a ternary only when the value is built from a prefix that may be missing, otherwise the markup renders the literal `undefined-suffix`:

```jsx
<a data-ms-id={prefix ? `${prefix}-link` : undefined} />
```

## Never mutate the DOM to add one

`document.querySelector` plus `setAttribute` in an effect is invisible to React, so any re-render that recreates the node drops the attribute silently. It also couples the selector to markup internals and to source order. If the target does not forward the attribute, fix that instead:

| situation | what to do |
|---|---|
| a component you own | let it forward props, or accept a `dataMsId` prop |
| a component taking an attributes or input props object | put `data-ms-id` in that object, whose keys are attribute names |
| a third party component forwarding nothing | wrap it in the caller, never inside the shared component |

A wrapper added inside a shared component leaks its identifier into every other feature using that component.

## One identifier, one element

Never repeat an identifier, and in particular never put it on both an element and one of its own ancestors. A selector would match both.
