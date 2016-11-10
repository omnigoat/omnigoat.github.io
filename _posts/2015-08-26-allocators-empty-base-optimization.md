---
layout: post
title: Allocators & Empty Base Optimization
---

Let's say, for the sake of argument, you're writing a drop-in replacement of `std::vector`. You'll quickly notice that if you're to maintain a compatible interface, you'll need to provide support for custom allocators. More importantly, you'll need to support the storage of *instances* of allocators. It's more than likely you've never used a custom allocator, because no one does. Great news! Someone out there does. I guess that means you're storing an instance of `Allocator` (your templated type) in your `vector` class. But wait!

## The Problem

Allocators don't necessarily have any members. Actually they probably don't. The default allocator almost certainly; the default allocator is defined to be stateless. It (probably) simply hands off to system `malloc/free` calls, and lets the operating system handle the free-list, fragmentation, etc. It does not contain any members. What is the size of such a type? It has no members, so surely zero? Of course not. The reasoning makes sense when you consider the following:

{% highlight c++ %}
// empty type
struct dragon_t {};

dragon_t henry, oliver;

// surely the addresses are different, but if the size of
// dragon_t was zero, they would probably overlap?
dragon_t* p1 = &henry;
dragon_t* p2 = &oliver;
{% endhighlight %}

C++ guarantees two differing instances have differing addresses. This means that if the address must differ, and a byte is the smallest addressable unit in C++ (it is), then a struct is going to take up at least one byte. 'henry' and 'oliver' would "stack" on top of each other otherwise. It's very likely that by storing an instance of `Allocator` we'll be storing an extra one byte, at least, in our vector reimplementation. That's a byte that contributes absolutely nothing. Fortunately there's a way around this. It's not even terrible.

## Empty Base Optimization

Maybe you've guessed at where this is going by the name of the post. I've told you what `Empty` would be, and we all love optimizations. All that leaves is *base*. And yeah, I'm talking about a *base class*. Above I wrote that "the address of two differing instances also differs". Since `dragon_t` has no size, the compiler gives it some size. But what if we have *other stuff* that we care about? And then what if we inherit from `dragon_t`?

{% highlight c++ %}
struct dragon_t {};
struct wise_dragon_t : dragon_t { uint32_t intelligence; };

wise_dragon_t matthew;
wise_dragon_t catherine;

static_assert(sizeof(matthew) == sizeof(uint32_t), "as expected");
{% endhighlight %}

Bam. When our base-class is empty, it contributes nothing to our size. This is because the address of `matthew` and `catherine` still differ. Since `dragon_t` has no size, if we `static_cast` from `wise_dragon_t` to `dragon_t`, we'll probably get the same pointer. But that's cool and totally allowed, and even expected. Let's note that if `wise_dragon_t` was also empty, *it* would be given a byte of size.

It's this interaction that leads us to Empty Base Optimization. As you've probably guessed, our allocators are going to be inherited from. Does it make sense to do this when the allocators have members? No. All it does is pollute our types with the members of the base-type. Also, the *is-a* relationship dies in a fire. Is `std::vector` an `std::allocator`? It sure does allocate, but it's no allocator. So with two downsides, it'd be best to avoid inheriting from base-types, notably allocators, when they have members. I mean, we usually don't care about EBO, until we start writing types that get used everywhere (like `vector`).

## Application

So we want to integrate Empty Base Optimization into our `std::vector` replacement. There are two approaches to this. We could inherit from a templated base class (`base_vector`) that selectively activates EBO for us, or we could use a "compressed pair" with one of our `vector` members. A compressed pair (à la `boost::compressed_pair`) takes two types, and activates EBO selectively. A `vector` usually has three members: pointer, size, and capacity. Sometimes this information is encoded as three pointers, but there is always one pointer, pointing to the start of the allocated memory. This pointer is an excellent candidate for combining with our allocator. Coupling the pointer with the allocator is not a bad thing, as they are already tightly associated. The allocator initialized the pointer, after all. This also removes complexity from the definition of our `vector`, which brings its own benefits.


{% highlight c++ %}
template <typename T, typename Alloc = std::allocator<T>>
struct vector
{
	// implementation...

private:
	size_t capacity_, size_;
	
	// this member contains the pointer and the allocator, possibly EBOd
	our_ebo_structure_t<T, Alloc> data_;
};
{% endhighlight %}

Let's first ask ourselves if it's worth adapting a more generalized type (`compressed_pair`) for this job. This EBO structure is essentially a trussied-up compressed-pair; is there any benefit in writing a more specialized version? I am arguing yes, for two reasons. The first is simply that we will be writing functions that perform *pointer-and-allocator* operations, and it would be kind of weird if they were written against a `compressed_pair` of arbitrary types. Secondly, this structure is emulating a pointer (with an allocator along for the ride). We can provide pointer-specific operators like `operator []`, `operator +`, etc., to provide a psuedo-pointer interface. 

Also, let's call our ebo-structure something better, like... `memory_t`. Pick whatever you want.

## Implementation

Let's quickly look at `base_memory_tx`, a type which selectively inherits - or stores a member of - the alloctor:

{% highlight c++ %}
template <typename Alloc, bool Empty = std::is_empty<Alloc>::value>
struct base_memory_tx;
{% endhighlight %}

It should be obvious we are going to write a version for when `Empty` is `true`, and when it is `false`. We will allow our derived types to access the allocator through the method `allocator()`, which is implemented differently in either case. I have omitted the constructors for brevity:

{% highlight c++ %}
template <typename Alloc>
struct base_memory_tx<Alloc, false>
{
	auto allocator() -> Alloc& { return allocator_; }

private:
	Alloc allocator_;
};

template <typename Alloc>
struct base_memory_tx<Alloc, true>
	: protected Alloc
{
	auto allocator() -> Alloc& { return static_cast<Alloc&>(*this); }
};
{% endhighlight %}


First, look at the declaration:

{% highlight c++ %}
template <typename T, typename Allocator = std::allocator<T>>
struct memory_t : detail::base_memory_t<T, Allocator>
{
	using value_type = T;

	memory_t();
	template <typename B> memory_t(memory_t<T, B> const&);
	explicit memory_t(Allocator const& allocator);
	explicit memory_t(value_type* data, Allocator const& = Allocator());

	auto data() const -> value_type* { return ptr_; }

	auto operator *  () const -> reference;
	auto operator ++ () -> memory_t&;
	auto operator [] (intptr) const -> reference;

	auto allocate(size_t) -> void;
	auto deallocate() -> void;
	auto construct_default(size_t idx, size_t count) -> void;
	auto construct_copy(size_t idx, T const& x, size_t count) -> void;
	// more methods...

private:
	T* ptr_;
};
{% endhighlight %}

Here I've provided the base type (full defintiion in [this gist][gist1]).


[gist1]: https://gist.github.com/omnigoat/a2715327c69ed350ff4f
