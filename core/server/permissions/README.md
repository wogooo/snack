Permissions
===========

Validate user against the database permissions set for that user, and that
user's role.

Exposes `check` and `refresh` methods.

TODO: Refresh this object when permissions get updated -- keeping in mind
      that the object instance needs refreshing on all workers. Probably
      will necessitate some form of broadcast.

TODO: The efficiency of the effectivePermissions queries leaves a lot to be
      desired.
