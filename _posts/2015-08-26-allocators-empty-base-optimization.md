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

// surely the addresses are different, but if the size of
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

Bam. When our base-class is empty, it contributes nothing to our size. This is because the address of `matthew` and `catherine` still differ. Since `dragon` has no size, if we `static_cast` from `wise_dragon` to `dragon`, we'll probably get the same pointer. But that's cool and totally allowed, and even expected, albeit not guaranteed. Since this is an optimization, nothing is guaranteed, of course. 

It's this interaction that leads us to Empty Base Optimization. As you've probably guessed, our allocators are going to be inherited from. Does it make sense to do this when the allocators have members? No. All it does is pollute our types with the members of the base-type. Also, the *is-a* relationship dies in a fire. Is `std::vector` an `std::allocator`? It sure does allocate, but it's no allocate. So with two downsides, it'd be best to avoid inheriting from base-types with members. I mean, we usually doesn't care about EBO, until we start writing types that get used everywhere.

## Application

So we want to integrate Empty Base Optimization into our `std::vector` replacement. There are two approaches to this. We could inherit from a templated base class (`base_vector`) that selectively activates EBO for us, or we could use a "compressed pair" with one of our `vector` members. A compressed pair (a la `boost::compressed_pair`) takes two types, and activates EBO selectively. A `vector` has usually three members: pointer, size, and capacity. Sometimes this information is encoded as three pointers, but there is (somewhat by definition) always one pointer, pointing to the start of the allocated memory. This pointer is an excellent candidate for combining with our allocator. Coupling the pointer with the allocator is not a bad thing, as they are already tightly associated (the allocator initialized the pointer, after all). This also removes complexity from the definition of our `vector`, which brings its own benefits.


{% highlight c++ %}
struct vector
{
	// implementation...

private:
	size_t capacity_, size_;
	
	// this member contains the pointer and the allocator, possibly EBOd
	our_ebo_structure_t data_;
};
{% endhighlight %}