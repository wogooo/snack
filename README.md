Snack
=====

Right now Snack isn't much of anything. My goal with the project is to create
a publishing system / CMS that is designed to be easy to develop on and
implements some notions I have about relations in a NoSQL / document store
world, as well as making task queues and background processes an easy and
natural part of the workflow.

Key projects used here: hapi, kue

*Phase 1

Create a functional API that allows the creation of a post, which includes an
author, tags, and image assets, all of which will be related documents.

Further, the image assets will be copied to an S3 instance by a background
demon, and will write their new URLs back to the asset document when ready.

*Phase 2

Implement all the features a decent blogging / publishing platform require
in an API. This includes CRUD for posts, pages, authors. Consider the many
listings potentially needed -- ordered set, reverse chronological, alphabetical,
tag, etc.

*Phase 3

Handle authentication issues!

*Phase 4

Build awesome admin UI using Angular.

--------------

I've used Ghost as a template for several things, and borrowed code from that
project. It's excellent, and works already so check it out if you stumble
upon this but want a blogging platform that works.

https://github.com/TryGhost/Ghost

