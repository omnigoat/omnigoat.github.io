---
layout: post
title: C++20 Concepts
---

A quick syntax-based overview of C++20 Concepts, as they are in the standard (circa January 2020).

### TL;DR

With the release of MSVC 16.3 (and some holiday time), I decided to convert my Eric Niebler-inspired templated SFINAE
hocus-pocus approximation of concepts into _actual_ concepts. But it's so hard to find up-to-date docs on how the
syntax is actually supposed to be. After some experiements (and reading), here are examples to get you started.

## Using Concepts in Functions

Let's come up with a synthetic problem that SFINAE/Concepts can fix. So, we have a log function for numbers, I guess.
We want to treat integers and floating-point numbers differently I suppose? So let's have one function, `log`, that forwards
the handling to different places.


### Example

This doesn't compile, but this is basically what we want:

{% highlight c++ %}
// pick between these two somehow

template <typename T>
void log(T&& x)
{
    log_integral(x);
}

template <typename T>
void log(T&& x)
{
    log_floating_point(x);
}
{% endhighlight %}


### SFINAE

This is what you'd write today, or maybe I should say _yesterday_? Haha nah your workplace won't catch up for years.

{% highlight c++ %}
template <typename T, typename = std::enable_if_t<std::is_integral_v<T>>>
void log(T&& x)
{ /* implementation irrelevant */ }

template <typename T, typename = std::enable_if_t<std::is_floating_point_v<T>>>
void log(T&& x)
{ /* implementation irrelevant */ }
{% endhighlight %}

### Concepts, Explicit Edition

Here is your first taste of concepts, constraining your function template:
 * This (a "requires clause") is unnecessarily verbose for simple concepts
 * You will need to use requires clauses like this for concepts that take multiple types
 * My syntax highlighter doesn't highlight 'requires' yet :(

{% highlight c++ %}
template <typename T>
requires std::integral<T>
void log(T&& x)
{ ... }

template <typename T>
requires std::floating_point<T>
void log(T&& x)
{ ... }
{% endhighlight %}

### Concepts, Decltype Edition

This won't make sense until the very next example, but you can also place the requires clause
_after_ the parameter-list. This allows you to do some funky things with `decltype`, shown here.
 * You need to `std::remove_reference_t` your decltypes for many concepts (some you don't)
 * I don't recommend doing this unless you really have to, it's hard to read

{% highlight c++ %}
template <typename T>
void log(T&& x)
requires std::integral<std::remove_reference_t<decltype(x)>>
{ ... }

template <typename T>
void log(T&& x)
requires std::floating_point<std::remove_reference_t<decltype(x)>>
{ ... }
{% endhighlight %}

### Concepts, Generic Function Edition

C++20 allows you to write generic functions which take `auto` as the parameter type, just like generic lambdas.
You then can omit the template specification. You don't get a typename, so you have to decltype the argument.
Now the above makes _more_ sense!

{% highlight c++ %}
void log(auto&& x)
requires std::integral<std::remove_reference_t<decltype(x)>>
{ ... }

void log(auto&& x)
requires std::floating_point<std::remove_reference_t<decltype(x)>>
{ ... }
{% endhighlight %}

### Concepts, Useful Edition

This what you want to write most of the time if:
 * Your concepts are simple and apply to the one type
 * You're not using Generic Functions

{% highlight c++ %}
template <std::integral T>
void log(T&& x)
{ ... }

template <std::floating_point T>
void log(T&& x)
{ ... }
{% endhighlight %}

### Concepts, Combo Edition

Highlighting the terseness you can achieve with "Constrained auto".

{% highlight c++ %}
void log(std::integral auto&& x)
{ ... }

void log(std::floating_point auto&& x)
{ ... }
{% endhighlight %}

### Putting Things Together

Here's a slightly more complex example showing things together:

{% highlight c++ %}
template <typename D, std::integral T>
requires std::assignable_from<D, T>
void assign_the_thing(D& dest, T&& x)
{
    dest = std::forward<T>(x);
}

// here's the generic-function version.
//
// in this case we don't need to std::remove_reference_t our decltypes because
// we actually want to know if we can assign the lvalue/rvalue x to the lvalue dest
//
// it's up to you which you prefer
void assign_the_thing(auto& dest, std::integral auto&& x)
requires std::assignable_from<decltype(dest), decltype(x)>
{
    dest = std::forward<decltype(x)>(x);
}

{% endhighlight %}

## Writing A Concept

Okay so you can use concepts defined in the standard library. Now let's write a concept, because
that's where the real magic is. And everyone loves magic.

### The simplest concept
Concepts are defined by a compile-time boolean expression. So this restricts nothing:
{% highlight c++ %}
template <typename T>
concept superfluous = true;
{% endhighlight %}

### A concept specified using a boolean
Here we create a concept from a standard-library compile-time boolean. This is, in fact, how
`std::integral` is (probably) implemented.
{% highlight c++ %}
template <typename T>
concept integral = std::is_integral_v<T>;
{% endhighlight %}
Boolean operators fully supported:
{% highlight c++ %}
// note -- std::integral & std::floating_point are concepts
template <typename T>
concept number = std::integral<T> || std::floating_point<T>;
{% endhighlight %}

### You want certain expressions to be valid
We can require the type to be able to do things. To do so we wrap expressions in braces:
{% highlight c++ %}
template <typename T>
concept you_can_increment_it = requires(T x)
{
    {++x};
};

// look, this concept requires two types
template <typename X, typename Y>
concept they_are_mathsy = requires(X x, Y y)
{
    { x * y };
    { x / y };
    { x + y };
    { x - y };
};
{% endhighlight %}

### You care about the types returned
Using some _serious voodoo magic_, C++20 will substitute the evaluated result-type
of the expression into the return-type-requirement, _at the front_, which is a little
weird, but okay.
{% highlight c++ %}
template <typename T>
concept you_can_increment_it = requires(T x)
{
    // incrementing doesn't change type
    //
    // the substitution is evaluated as:
    //   std::same_as<your-expressions-resultant-type, T>
    {++x} -> std::same_as<T>;

    // addition results in something convertible to an int
    {x + x} -> std::convertible_to<int>;
};
{% endhighlight %}


### You want to inspect types, members, and methods
Prefacing a statement in the requires clause with `typename` tells the compiler
you're about to interrogate the type to ensure it has a sub-type. If it doesn't,
the concept hasn't been satisfied.
{% highlight c++ %}
template <typename T>
concept its_a_dragon = requires(T x)
{
    // this type trait must be able to be instantiated
    typename dragon_traits<T>;

    // T has a nested typename for some pointer idk use your imagination
    typename T::dragon_clan_ptr;

    {x.breathe_fire()};
    {x.dragon_breath_firepower()} -> std::convertible_to<uint>;
};

// notice we don't need a 'x' argument if we don't do any expression stuff
template <typename T>
concept its_a_knight = requires
{
    typename T::castle_type;
    typename T::armour_type;
    typename knight_traits<T>;
};
{% endhighlight %}

### Invovled Example
Here we use several of our previous ideas to describe something we can new & delete.
{% highlight c++ %}
template <typename T>
concept dynamically_allocatable =
    std::default_constructible<T> &&
    std::copy_constructible<T> &&
    std::destructible<T>
requires(T a, size_t n)
{  
    requires std::same_as<T*, decltype(new T)>;
    requires std::same_as<T*, decltype(new T(a))>;
    requires std::same_as<T*, decltype(new T[n])>;
    { a.~T() } noexcept; // destructor must be noexcept (and exist!)
    { delete new T };
    { delete new T[n] };
};
{% endhighlight %}

## Constrained auto, but everywhere

"Constrained auto" means you jam a concept in front of `auto` to ensure whatever type
it is conforms to the concept. You can put this damn near anywhere you use `auto`.

{% highlight c++ %}
template <typename G, knight_concept K>
void murder_jim(G&& game_mode, K&& knight)
{
    dragon_concept auto jim = find_jim(game_mode);

    knight.murder_dragon(jim);
}
{% endhighlight %}
No but like everywhere:
{% highlight c++ %}
auto find_jim(game_mode_concept auto&& game_mode) -> dragon_concept auto
{
    return game_mode.get_antogonist();
}
{% endhighlight %}


I hope that helps you get a quick handle on how concepts are crafted and used in C++20.