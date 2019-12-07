---
layout: post
title: How I Write C++
custom_css: how-i-write-css
---

<style>
.keyword {
	color: #4af;
	font-family: Consolas;
}

.comment {
	color: #4a6;
	font-family: Consolas;
}

.macro {
	color: #fa4;
	font-family: Consolas;
}

.newdelete {
	color: #d22;
	font-family: Consolas;
}

.literal {
	color: #da9;
	font-family: Consolas;	
}
</style>


By all means judge.

## Colours

Let's start with something easy, how I colourize my syntax-highlighting:

_(I should point out that `Rogue`, the syntax-highlighter for this webpage, lacks features)_

_(I fully expect this part to generate the most amount of hate)_

 * **Keywords** are <span class="keyword">blue</span>
 * **Comments** are <span class="comment">green</span>
 * **Macros** are <span class="macro">ORANGE_MACROS()</span>
 * **new/delete** are <span class='newdelete'>new, delete []</span> (red, for danger)
 * **Literals** are usually whatever, Visual Studio uses <span class='literal'>"#da9"</span>
 * ***Everything else*** is left as "default". Some people's code looks like a pina colada;
   enum values, function names, user-defined types, constants, it's just too much man.
   I want to be able to read the structure of your code, not have to break open a pinata.

## General Code

Here's a small working example that illustrates many things I'll go over:

{% highlight c++ %}
struct dragon_t
{
	// I wouldn't do something this asinine in real code
	using name_t = std::string;

	dragon_t();
	dragon_t(name_t const&);

	auto name() const -> name_t const& { return name_; }
	auto age() const -> int { return age_; }

	auto calculate_taxes() -> void;

private:
	name_t name_;
	int age_ = 0;
}
{% endhighlight %}

### Typenames

I use the naming pattern
of all-lowercase with underscores, with types suffixed by `_t`. This is not something I love.
Since identifiers are shared between typenames
and methods/members, you sometimes have a [e.g.] mesh simply called `mesh`. Well, you'd
need to rename the member or the type. I chose types.

### Use `using` instead of `typedef`

The using expression unites type definitions to the same structure as others:

{% highlight c++ %}
// using and variables now look/behave similarly
using boss_t = dragon_t;
auto boss = boss_t{"henry"};

// 'typedef' gets weird for function-pointers; 'using' helps alleviate this somewhat
typedef int(dragon_t::*fnptr)(int, int);
using fnptr = int(dragon_t::*)(int, int);

{% endhighlight %}

The using expression consolidates the definition of types in the same layout as functions and variables.
The name of a variable in a varaible-declaration is on the left (`<type> <variable-name> = <expression>`),
as are functions (`<function-name><signature> = <body>`). Lambdas too: `auto <variable-name><signature> = <expression>`.
The `using` declaration allows types to take on the same structure, instead of `typedef` being different, and
_very_ odd sometimes.

### Const to the right

I place `const` to the right-hand-side of my types:

{% highlight c++ %}
// your code
void translate_dragons(const dragon_list_t& dragons, const knight_list_t& knights)
{}

// the code she tells you not to worry about
void translate_dragons(dragon_list_t const& dragons, knight_list_t const& knights)
{}
{% endhighlight %}

You've probably seen this before, however this flies in the face of many (most) people's
code. Visual Studio actually displays the types in my errors with the const reformatted to the left.
"Why would you do such a thing!?" I hear you screaming. The simple answer is that I tried it
out for no reason and found it conducive to coding. When I'm writing code I'm first and foremost
thinking about what types I'm using, and _then_ their "mode of transport". That can come after I've used the correct
type. So I'll start typing `dragon_list_t`, and whilst the fingers are tapping on the keys, I can think
about if I'm using a const pointer, or a non-const reference, or what have you.

Secondly, when I need [e.g.] a pointer to a const-pointer to a non-const integer, then I don't
have to think at all. Having the const on the left-hand-side of the type is literally the exception,
not the rule. I have no idea why const-to-the-left is the default de jour.

### Eschew `get` as a prefix for accessors

By accessors I specifically mean providing access to a _member_, either mutable or immutable (hopefully
immutable, you animal). Something by const-reference, or
some integral that's just passed by value. Virtual functions are fine for this. The logic behind this
is that things should have _descriptive names_. Anything that does _work_ should have a name that implies
what it does. Anything that does _lots of work_ should have a name that signifies that more explicitly
(something like `compute_`). Anything that is just essentially a property should be named that property.

#### Note 1: I accept `is_` as a prefix for trivial expressions.

#### Note 2: If you need a direct setter, just prefix with `set_` and feel bad.


### Trailing return-types as a default

Let's also show the difference between `get_` as a prefix:

{% highlight c++ %}
// return type in the regular spot, requires visual search for function-names
transform_list_t const& get_transforms() const;
int get_height() const;
vertex_t* get_vertices() const;

// suddenly easier to read the functions. return types still easy to find.
auto transforms() const -> transform_list_t const&;
auto height() const -> int;
auto vertices() const -> vertex_t*;
{% endhighlight %}

I'm a big believer in making code as easy to read as possible, and I think the names of things play a
big part in that. Everyone's familiar with getting frustrated at reading code where the
names of functions are unrelated to what they do. To that end, being able to parse with the human eye
a class and its members and methods should be made easy. Aligning the start of the method-names is a
trivial gain, but an undervalued one. It also means we don't have to change anything when we require
decltype based upon our arguments. Which never happens. And when it does you can just `decltype(auto)`
your function, which announces it as special from the _very first character_.

### Use `struct`, not `class`

We all know the two are equivalent, except for access modifiers (`struct` defaulting to public, `class`
defaulting to `private`). Nobody uses private or protected inheritance, and if you place your public
interface at the top of the type, like I'll suggest below, then using `class` would require you to
switch to public before switching back to private like an idiot.

### Struct layout

Before we get to specifics, let's think about what we're trying to accomplish with our type declaration.
We need the 

