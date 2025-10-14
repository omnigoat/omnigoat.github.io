---
layout: post
title: On Namespaces
---

This work is about C++ namespaces.

This is not about C#, Java, nor any other language designed with _alternative brevity_.

## TL;DR

 * Namespaces are for organising code not people
 * Keep namespace nesting to a minimum
 * Strive for memorable and easy-to-type namespaces
 * `using namespace` shouldn't exist outside of function-bodies

## Introduction

I didn't think I had to write this post.

I thought everyone had naturally learnt, through
frustration and agony, what to avoid when using namespaces. I thought all the _C-with-classes_
folks had died, adapted, or ensconsed themselves in a fortress of code that
was too important for their organisation to lance.

It turns out I'm super-wrong; namespaces are getting misused all the time. I watch in
horror as someone tours me through their codebase and whispers, with pride in their eyes and idiocy on
their tongue, "here is our teams namespace". Heavens friend, I'll stab
you with my Learning Knife.

## Namespaces For The ~~People~~ Code

A codebase is made up of _code_ like algorithms, data-structures, routines,
and global variables because you're a monster. Namespaces are a tool to organise that code
into cognitively separate chunks, so that us idiot humans can more easily store the whole
thing in our head. Good code organisation leads to an easier time navigating a codebase,
inferring where pieces may lie like a
well-drawn map.


A codebase is _not_ made up of people, teams, JIRAs, initiatives, or whatever
bastardization of Agile Development you've half-remembered from a fever dream.
People aren't present in code; a team isn't present in code; if
you see namespaces that designate which _people_ code belongs to you are seeing an anti-pattern.<sup>†</sup>


**Don't use namespaces to designate your company, organisation, or team. Use namespaces to
separate libraries, systems, and code into cognitively distinct areas within your codebase.**

<p style="width: 100%; text-align: center">⁂</p>

```cpp
// namespace for our new database product, DatabasePlus!
namespace TerrorCorp::DatabasePlus
{
}
```

I shall now rant about top-level company namespaces.

An all-encompassing namespace that bears the name of an organization is the most common
mistake I see with "people namespaces". If this top-level namespace is
the only one of its kind then you should delete it.

A top-level company namespace only does _one_ functional thing - it prevents any nested namespace
from clashing with an external library. In all my years I can not recall any
top-level namespace clashing with another, and it is straightforward to work around clashing
namespaces.

The downside is that it's a
pain to type every time. How do engineers get around that? They put _everything_ inside the
organisation namespace, so it's like it doesn't exist in the first place. Wow what smart
people, they effectively deleted your namespace for you. Save them the trouble and don't
include it from the start.

"But what about all those little utility functions and things, they can't just _live in the global
namespace_ like a tramp in the woods". Firstly, weird analogy dude. Secondly, this pattern of
thinking is wrong. You should see a collection of useful functions and think "I should wrap these
in a library with a nice short name", like `std` except not that because it's already taken.

<p style="width: 100%; text-align: center">⁂</p>

<sup>†</sup> I realise that there may be teams that share the same name as the piece of technology
they're working on - for which there might be a corresponding namespace. I hope you're smart enough to
realise that I'm not talking about you. If the namespace makes sense for the code, I don't
care if your team is similarly named. Call your team Global Namespace for all I care.
I'm offended you made me write this caveat out.


## Go Wide, Not Deep

```cpp
 1  namespace hani
 2  {
 3    namespace logging
 4    {
 5      namespace diagnostics
 6      {
 7         // kill me I am not typing "hani::logging::diagnostics" to
 8        // use this bit of your library
 9      }
10    }
11  }
```

In life if you wish to promote a particular behaviour I recommend removing barriers that
makes that difficult. The two primary barriers to engineers
engaging with your namespaces are _keystrokes-per-second_, and _thinking-units-per-interaction_.
Deeply nested namespaces fall afoul of both these.

Engineers will hate a codebase if they have to type a lot of characters to access every
function or type within it. They will stop being good citizens and go rogue, they will
start writing `using namespace`, and they will call you names. You will
have failed with your design because it is hard to use.

Remembering _where_ particular functionality lies becomes harder in a codebase with
deeply-nested namespaces. I speculate due to
the lossy nature of human memory that this falloff is super-linear. In every case
it is worse. If you have usable functionality in a three-levels-deep namespace,
you are probably in a sad place.<sup>†</sup>

The solution, friends, is to nest less.

If your codebase is large with nicely named distinct bits there is the temptation to carroul these
pieces into groups; engineers are frightened of numbers greater than six.
Muster your courage and allow fifteen, twenty adjacent namespaces.
Realise that the number of namespaces has not changed. Instead the amount of overhead to engage with
them is reduced. Engineers do not have to remember to which namespaces the namespaces belong.

You can use this principle to your advantage. Your library will have its common functionality
which should be exposed as per. But you can place advanced, "expert friendly" functionality into
a nested namespace. It signifies that the user of your library has
entered into a specially designated area and needs to know what they're doing. It feels like
diving - the deeper you go, the more prepared you should be, and the more ferocious the dragons.

<p style="width: 100%; text-align: center">⁂</p>

<sup>†</sup> Yeah I'm not including internal or _detail_ namespaces. Those are an artefact of
the language, and not the topic today.

## A Rose By Any Other Namespace

(This bit is more subjective than the obviously factual statements above)

Names are hard. I get that. That is why marketing people are employed to think up
the perfect intersection between a word that is catchy and a word that represents a product.
Codebases quickly grow too large for people to know the contents of every line - you must sell
the functionality of the code within. 

We must be that marketing  person for our own code. We need to market to others, or they will
write another version of what we have already done, but worse. We must market to ourselves, because
future us does not remember. The engineer I curse with the most frequency is me of coding-past. It
is nice when I can give that guy a break.

The name of a product is outside the scope of this ~~rant~~ essay; I don't have rules for what
constitutes a good name for a product. I _do_ have rules for what makes up a good namespace. You
may notice the concepts of _keystrokes-per-second_, and _thinking-units-per-interaction_ rear
their heads again. At the end of this list you will know why I consider `std` to be a good namespace.

 * **Lean towards catchy rather than descriptive**. People really
   can't understand a library from just its name. Even if `testface` implies a testing
   library, one can not infer much else. Give up the battle and use a name people _remember_.
   This is very true for products, but it is also true for any area of your codebase.

 * **Err on the side of brevity**. We move our mouths much faster than we type - let people say
   the name of your product, but type a shorthand when writing code. Shorter things are easier to remember too,
   especially if you're sipping that Web 2.0 juice and naming your things `kodi` or something
   nonsensicle.

 * Fingers don't handle consecutive repositioning well. **Avoid words for which a sequence of 
   letters requires consecutively repositioning the same finger**. Compare the ease of typing `ede::` with
   `eye::`, or `juhu::` with `jihi::`, and bask in this trivial revelation.

 * Double letters like `jeep::` or `folly::` are fine but **avoid double letters on little fingers**
  (like `zz` or `pp`). Those fingers are weak and will slow you down.

 * **Never end a namespace with a letter that requires the little-finger on the left hand**. I
   realise keyboards are not identical everywhere, but take a punt that 95% of people will
   QWERTY until they die. After a namespace in C++ you type a colon `:`, and
   if you are typing correctly you use the little-finger on your left hand to press Shift.



## Using Namespace
You should never place a `using namespace` statement in any scope greater than a
function-body. It's well-known that placing said statement in a header-file is
_obviously_ bad, as you pollute all translation units which include that header-file. Given
engineers propensity to include random header files at the drop of a hat and you will soon
have polluted your whole codebase. These days, with the proliferation of _unity builds_,
the translation-unit scope is no longer safe. That means you can't put a `using namespace` at
the top of your `.cpp` file as a unity build will pollute all adjacent source files. So... don't do that.

## Conclusion
Namespaces are basically the first thing engineers will type when using your code. Make
sure their experience is a good and memorable one.