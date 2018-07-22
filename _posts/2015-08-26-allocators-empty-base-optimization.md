---
layout: post
title: Allocators & Empty Base Optimization
---

_Sometimes you have things (often allocators) that have no members and you want them not to be given arbitrary size._

Let's say, for the sake of argument, you're writing a drop-in replacement of `std::vector`. You'll quickly notice that if you're to maintain a standards-compatible interface, you'll need to provide support for custom allocators. More importantly, you'll need to support the storage of *instances* of allocators, because these days allocators can be stateful. It's more than likely you've never used a custom allocator, because no one does. Well, great news! Someone out there does. I guess that means you're storing an instance of `Allocator` (your templated type) in your `vector` class. But wait!

## The Problem

Allocators don't necessarily have any members. Actually they probably don't. The default allocator almost certainly; the default allocator is defined to be stateless. It (probably) simply hands off to system `malloc/free` calls, and lets the operating system handle the free-list, fragmentation, etc. It does not contain any members. What is the size of such a type? It has no members, so surely zero? Of course not. The reasoning makes sense when you consider the following:

~~~ cpp
// empty type
struct dragon_t {};

dragon_t henry, oliver;

// surely the addresses are different, but if the size of
// dragon_t was zero, they would probably overlap?
dragon_t* p1 = &henry;
dragon_t* p2 = &oliver;
~~~

C++ guarantees two differing instances have differing addresses. This means that if the address must differ, and a byte is the smallest addressable unit in C++ (it is), then a struct is going to take up at least one byte. `henry` and `oliver` would "stack" on top of each other otherwise. It's very likely that by storing an instance of `Allocator` we'll be storing an extra one byte, at least, in our vector reimplementation. That's a byte that contributes absolutely nothing. Fortunately there's a way around this. It's not even terrible.

## Empty Base Optimization

Maybe you've guessed at where this is going by the name of the post. I've told you what `Empty` would be, and we all love optimizations. All that leaves is *base*, and yeah, I'm talking about a *base class*. Above I wrote that "the address of two differing instances also differs". Since `dragon_t` has no size, the compiler gives it some size. But what if we have *other stuff* that we care about? And then what if we inherit from `dragon_t`?

~~~ cpp
struct dragon_t {};
struct wise_dragon_t : dragon_t { uint32_t intelligence; };

wise_dragon_t matthew;
wise_dragon_t catherine;

static_assert(sizeof(matthew) == sizeof(uint32_t), "as expected");
ASSERT(&matthew != &catherine && sizeof(matthew) == sizeof(catherine),
	"different but equal");
~~~

Bam. When our base-class is empty, it contributes nothing to our size. This is because the address of `matthew` and `catherine` still differ. Since `dragon_t` has no size, if we `static_cast` from `wise_dragon_t` to `dragon_t`, we'll probably get the same pointer. But that's cool and totally allowed, and even expected. Let's note that if `wise_dragon_t` was also empty, *it* would be given a byte of size.

It's this interaction that leads us to Empty Base Optimization. We are going to inherit from our allocators. It does not make sense to do this when our allocators have members - all it does is pollute our types with the members and methods of the base-type, for no gain.

## Putting It Into Practice

So we want to integrate Empty Base Optimization into our `std::vector` replacement.

There are two approaches to this:

 1. We could inherit from a templated base class (`base_vector`) that either uses EBO or not with our allocator

 1. One of our members could be a _compressed pair_:

 A compressed pair (à la `boost::compressed_pair`) takes two types, and activates EBO selectively. A `vector` usually has three members: pointer, size, and capacity (sometimes this information is encoded as three pointers). This pointer is an excellent candidate for combining with our allocator. The pointer and the allocator are already tightly associated &mdash; after all, the allocator initialized the pointer. This also removes complexity from the definition and visualization of our `vector`, which brings its own benefits.

 Let's look at a sample implementation:


~~~ cpp
template <typename T, typename Alloc = std::allocator<T>>
struct vector
{
	// implementation...

private:
	size_t capacity_, size_;
	
	// this member contains the pointer and the allocator, possibly EBOd
	our_ebo_structure_t<T, Alloc> data_;
};
~~~

Let's first ask ourselves if it's worth adapting a more generalized type (`compressed_pair`) for this job. `our_ebo_structure_t` is essentially a trussied-up compressed-pair; is there any benefit in writing a more specialized version? I am arguing yes, for two reasons: Firstly, we will be writing functions that perform intricate *pointer-and-allocator* operations, and it would be kind of weird if they were written against a general
`compressed_pair`. Secondly this structure is emulating a pointer, with an allocator along for the ride. We can provide pointer-specific operators like
`operator []`, `operator +`, etc., to provide a psuedo-pointer interface.

Also, let's call our ebo-structure something better, like... `memory_t`. Pick whatever you want.

## Implementation I: EBO

We are using EBO when our allocator has no members, or _is empty_, in `std`  nomenclature. We will define a base class that either stores the allocator as a member, or inherits from it:

~~~ cpp
template <typename Alloc, bool = std::is_empty_v<Alloc>>
struct base_memory_t;
~~~

We are going to write a version for when `std::is_empty` is `true`, and when it is `false`. We will allow our derived types to access the allocator through the method `allocator()`, which is implemented differently in either case. I have omitted the constructors (and const versions of the methods) for brevity:

~~~ cpp
template <typename Alloc>
struct base_memory_t<Alloc, false>
{
	auto allocator() -> Alloc& { return allocator_; }

private:
	Alloc allocator_;
};

// this is one of the only times I've ever used protected inheritance
template <typename Alloc>
struct base_memory_t<Alloc, true>
	: protected Alloc
{
	auto allocator() -> Alloc& { return static_cast<Alloc&>(*this); }
};
~~~

## Implementation II: Interface
Inheriting from this base type will be our `memory_t` type, which is going to be typed upon `T`, the type of the memory, and `Allocator`, which is what all the fuss is about. I want people to be able to express "this is memory full of [sic] integers, handled by this allocator". If you don't want to type your memory, you could leave it out, or simply pass along `std::byte`.

I have now demonstrated the benefits of EBO and how to jam it into your code. I'm going to stop here, and show you an incomplete reference of the type, to demonstrate some of the features that would be lacking from using a more generalized compressed pair. I hope if you're ever writing something that requires allocators you get a pay raise, but also since you clearly care about allocations, you write your code to minimize space in the common path.

~~~ cpp
template <typename T, typename Allocator = std::allocator<T>>
struct memory_t : detail::base_memory_t<Allocator>
{
	using value_type = T;
	using allocator_type = Allocator;
	using reference = value_type&;
	using pointer = value_type*;

	explicit memory_t(allocator_type const& = allocator_type());
	explicit memory_t(value_type* data, allocator_type const& = allocator_type());
	explicit memory_t(size_t capacity, allocator_type const& = allocator_type());

	auto data() const -> value_type* { return ptr_; }

	auto operator *  () const -> reference;
	auto operator [] (size_t) const -> reference;
	auto operator -> () const -> pointer;

	// simple allocator interface
	auto allocate(size_t) -> void;
	auto deallocate() -> void;
	
	template <typename... Args>
	auto construct(size_t idx, Args&&...) -> void;
	template <typename... Args>
	auto construct_range(size_t idx, size_t count, Args&&...) -> void;
	
	auto destruct(size_t idx, size_t count) -> void;

private:
	value_type* ptr_ = nullptr;
};
~~~

