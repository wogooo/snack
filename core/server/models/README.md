Models
======

## Conventions

Every model exports a `register` method. It can also set an `after` function
to be executed after all models have loaded (useful for establishing model
relations).

`modelName` should _always_ begin with an initial capital letter, like `Post`.
This is due to jugglingdb naming tables with the exact literal string entered,
and also created relations by concatenating those. So, to have readable relation
tables, like `PostAsset`, each model needs a capital. `modelName` appears in
the model data itself as the lowercase form, `post`.

Any model should be considered as implicitly belonging to a `collection` of
models that will be named as the pluralized form of the singular model type.
Thus `post` belongs to the `posts` collection, as represented by the API library
`posts` and the API route `/api/v1/posts`. The `inflection` module is being
used, and it will lexically determine pluralization, so a model of type `person`
would end up in a collection named `people` not `persons`.

Every model defines an `id` and a `type` to ensure it can always be
identified and found without any deep analysis of the object.

Most models contain private, ephemeral properties, named with a leading and
following underscore, i.e. `_version_`. These properties should not be written
to directly, and will only be managed internally by state changes and other
information passed through some back channel. They would also not be preserved
in a hypothetical revision or backup scenario.

All models will define a `type` and `kind`. These are logical subdivisions of
the model. `type` is the lowercased `modelName`, so a Tag model
would be of `type` "tag".

`kind` is a further subdivision: with the Asset model example above, it may have
`type` "asset", `kind` "image".


