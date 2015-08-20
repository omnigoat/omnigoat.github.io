---
layout: post
title: Expression Templates & SSE: Just Don't
---

This post is going to be about basic Expression Templates, basic SSE, and why combining the two just isn't useful.

### Expression Templates, The Basics

Expression Templates are a C++ technique to generate optimized code for arithmatic expressions, usually of vector-types. Many libraries implement them, oftentimes because they use dynamically-allocated memory to handle arbitrarily-sized vectors and matrices. For these libraries, Expression Templates are super-good: They reduce memory allocations, inhibit spurious instructions, and elide temporaries. For libraries that don't use dynamically-allocated memory, and instead use those traditional four `float` members (`float x, y, z, w;`), the first benefit doesn't apply but the last two are still valid and useful. Articles on Expression Templates are numerous, and several are linked here. DO THIS JONATHAN BEFORE YOU PUBLISH. XD

### SSE, The Basics

SSE stands for Streaming SIMD Extensions, where SIMD stands for "Single Instruction, Multiple Data". As the name suggests, SSE will help speed up your arithmatic code by doing mulitple operations at once. This means, for example, if you want to mulitply a vector by a scalar, you can mutliply all the vector's components in one instruction. This is faster than using many instructions. This is also an over-simplification (there are a finite limit of components that can fit per SSE-instruction), but close enough. One set of instructions deals with four 32-bit floating-point components. This is obviously a perfect match for the ubiquitous vector4f class present in almost all game engines, as well as the 4x4 matrix type. Since the majority of graphics is maths that looks cool, the majority of graphics-engines get performance benefits from SSE. SSE is a well-trodden and legitimate optimization.


### Double, Double, Toil and Trouble

So here's the bit where I deconstruct why SSE & Expression-Templates have no reason being mixed for games engines. Later on I'll partially contradict myself, so stay tuned for that! Perhaps I should first state that any library that's written for arbitrarily long vectors (with dynamic allocation, almost certainly) will benefit from mixing SSE and Expression-Templates. The benefits of SSE are independant of Expression-Templates, and Expression-Templates are very needed when dealing with things that allocate on the heap. However your game engine's vector4 and matrix4x4 classes do not dynamically allocate (and if they do, get out), rendering that benefit moot. The vast majority of spurious instructions previously mentioned occur when you calculate the result of the entire vector, and use only part of it. That was traditionally where Expression Templates gave definitive savings. However, now that all components are calculated in lockstep with each other, thanks to SSE, any saving there is almost irrelevant. Finally, the generation of temporaries (multiple vector4s being instantiated for an expression such as `vector4 r = a + b + c * f;`) is irrelevant when those temporaries are 

main	PROC						; COMDAT
	movaps	xmm1, XMMWORD PTR __xmm@3f8000003f8000003f8000003f800000
	movaps	xmm2, XMMWORD PTR __xmm@408000004080000040800000408ccccd
	xorps	xmm0, xmm0
	addps	xmm1, xmm0
	addps	xmm2, xmm1
	cvttss2si eax, xmm2
	ret	0