---
layout: post
title: "How To Code #1 - Booleans In Functions"
---
## Booleans?

This whole post is predicated on booleans = bad, and more booleans = more bad.

To start off with I'll justify boolean parameters being bad.

Consider the following code:
```
model.setTranslation(myvec, true);
```

Can you tell what it's doing?

If you have three boolean parameters in your function signature then you are part of the problem. Especially if you did it on purpose and think there's nothing