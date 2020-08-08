---
layout: post
title: On Namespaces
---

## TL;DR

 * Namespaces are for organising code not people
 * Keep namespace nesting to a minimum
 * Strive for memorable and easy-to-type namespaces

## Introduction

I didn't think I had to write this post. I thought everyone had naturally learnt, through
frustration and agony, what to avoid when using namespaces. I thought all the _C with classes_
folks had died, adapted, retired, or ensconsed themselves in a fortress of C code that
was too important for their organisation to lance (or y'know it's actually important and
they're doing a respectable job lmao).

It turns out I'm super-wrong. Namespaces are getting misused all the time! I watch in
horror as someone tours me through their codebase, with pride in their eyes and idiocy on
their tongue, as they whisper "here's our company's namespace". Heavens friend, I'll stab
you with my Learning Knife.

## Namespaces For The ~~People~~ Code

A codebase is made up of _code_, like algorithms, data-structures, routines,
and global variables because of _course_ you've got global variables you travesty of a
person. A codebase is _not_ made up of people, teams, JIRAs, initiatives, or whatever
bastardization of Agile Development you've half-remembered from a fever dream. Namespaces
are a tool to organise code into cognitively separate chunks, so that us idiot humans
can more easily store the whole thing in our head. Good code organisation leads to an
easier time navigating a codebase, mapping where pieces may lie due to a well-drawn map.

People aren't present in code; a team isn't present in code; if
you see namespaces that designates which _people_ code belongs to you are seeing an anti-pattern.

I realise that there may be teams denoted by a given name that maintain code, lovely code,
beautiful code, enclosed within a logical and succient namespace, for which that namespace
by chance or by providence is the _same name as the team_. I hope you're smart enugh to
realise that _I'm not talking about you_. If the code makes sense you can call your team
the same name as the namespace - you can call your team
Global Namespace for all I care - and I'm offended you made me write this caveat out.


**Don't use namespaces to designate your company, organisation, or team; use namespaces to
delinearate libraries, systems, and cognitively separate pieces of code. Bonus: Onboarding
becomes 1% easier.**

### Top-level company namespaces

In this bonus section I rant futher.

A company-level namespace is indicitive of using namespaces for organising people instead
of code. It might be the only one of its kind - in these cases I suspect narcissism rather than a
lack of understanding - but still you should be careful, and ideally delete it.

A top-level company namespace only does _one_ functional thing - it prevents namespace clashes
of any sub-namespace from an external library. In all my years I can not recall any
top-level namespace clashing with another. Library names are too distinct - this is
especially true if you follow my rules for naming namespaces. It's also
solvable easily enough if they do. A company namespace does not come with
a good enough positive to outweight the negatives.

What are the negatives? Well, it's a
pain to type every time. How do coders get around that? They put _everything_ inside the
organisation namespace, so it's like it doesn't exist in the first place. Wow what smart
people, they effectively deleted your namespace for you. Save them the trouble and don't
include it from the start. Clashing namespaces can be dealt with in many ways.


## Categorize Wide

If you're anything like me, 