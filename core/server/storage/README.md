Storage
=======

WARNING: This needs LOT'S of work, and will change.

TODO: Implement common library for loading packs, regardless of whether they are
for storage, demon, etc...

The storage component can register packs exporting a `storage` property, or
single-purpose packs exporting `register`.

What this means is, if you configure a pack in `config.js` and the file exists
in one of the paths, it _will_ try to load -- so don't put it in your config, or
disable it if you don't want it!

Common storage interface methods:

save
exists
update
destroy
