---
layout: post
title: Allocators & Empty Base Optimization
---

Let's say, for the sake of argument, you're writing a drop-in replacement of `std::vector`. You'll quickly notice that if you're to maintain a compatible interface, you'll need to provide support for custom allocators. More importantly, you'll need to support the storage of *instances* of allocators. It's more than likely you've never used a custom allocator, because no one does, but great news, someone probably does! So you'd better support them. And I guess that means you're storing an instance of `Allocator` (your templated type) in your `vector` class. But wait!

## The Problem

Allocators don't necessarily have any members. Actually they probably don't. The default allocator almost certainly. It simply hands off to system `malloc/free`, and lets the operating system handle the free-list, fragmentation, etc. It only contains methods, no members. What is the size of such a type? It has no members, so surely zero? Haha no. The reasoning makes sense when you consider the following:

{% highlight c++ %}
// empty class
struct dragon {};

dragon henry, oliver;

// surely the addresses are the same, but if the size of
// dragon was zero, they would probably overlap?
dragon* p1 = &henry;
dragon* p2 = &oliver;
{% endhighlight %}

C++ guarantees the address of two differing instances also differs. This means that if the address must differ, and a byte is the smallest addressable unit in C++ (it is), then a struct is going to take up at least one byte. And probably four, because a 32-bit (or 64-bit) CPU finds 32-bit chunks of memory very easy to work with. So `sizeof(dragon)` probably returns 4. Getting back to our problem-at-hand, it's very likely that by storing an instance of `Allocator` we'll be storing 4 bytes in our `std::vector` that contribute absolutely nothing. Fortunately there's a way around this. It's not even terrible.

## Empty Base Optimization

Maybe you've guessed at where this is going by the name of the post. Because I've sure told you what `Empty` would be, and we all love optimizations. All that leaves is *base*. And yeah, I'm talking about a *base class*. Above I wrote that "the address of two differing instances also differs". Since `dragon` has no size, the compiler gives it some size. But what if we have *other stuff* that we care about? And then what if we inherit from `dragon`?

{% highlight c++ %}
struct dragon {};
struct wise_dragon : dragon { uint32_t intelligence; };

// sizeof(matthew) == sizeof(uint32_t)
wise_dragon matthew;
wise_dragon catherine;
{% endhighlight %}

Bam. When our base-class is empty, it contributes nothing to our size. This is because the address of `matthew` and `catherine` still differ. Since `dragon` has no size, if we `static_cast` from `wise_dragon` to `dragon`, we'll probably get the same pointer. But that's cool - that's totally allowed, and even expected, albeit not guaranteed. Since this is an optimization, nothing is guaranteed, of course. 

