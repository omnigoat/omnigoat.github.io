---
layout: post
title: DirectX 11 Resource Management
---

DirectX 11 is somewhat unintuitive for someone entering the field, or for someone (the author) who hasn't played with DirectX since version 9. Why did I leave? Because mobile, that's why. But now my side-projects are DirectX 11, possibly 12 in the future (payoff worth it? Jury is out). And I've taken the roundabout trip of learning DirectX 11's resource management. It's suprisingly badly documented, which isn't like Microsoft; DirectX has historically had great documentation.

## Buffers & Textures is-a Resource

Let's define terminology, because that surely makes for good reading. A *resource* is an abstract concept, essentially defining a *thing* that will take up memory in RAM somewhere. All it really can tell you is if it's a *Buffer* or a *Texture*. But it's definitely there and needs correct lifetime management. So, let's go over the differences between, and similarities of, Buffers and Textures. Both are fundamentally allocations on the GPU, in Video RAM, or vram. Indeed, they both possess similar flags regarding cpu-access, binding, and "usage". "Usage" is DirectX's vague term that defines how the resource should be accessed by the gpu. The stricter you are, the potentially faster the resource can be used. This applies for most things created on the gpu: The more flexible you make your resource, the potentially slower it could be. I have no idea how *much* slower, or indeed what real-world cases trigger the slow-path, but in general it's easy enough to be relatively exacting in your usage.

So they're pretty similar: They both define memory and how it's accessed/updated. However, the *format* of that memory is the single biggest difference between the two. Buffers don't define what the memory is storing. It could be god-damned anything. `float4`, `uint64`, a structure you've defined which is 200 bytes large? No problems (with caveats). You'll notice, if you find the API reference for `CreateBuffer`, that it doesn't even *take* a format parameter. Textures, on the other hand, do. This allows for lots of assumptions, and thus optimizations, throughout the gpu pipeline. The size and number of components matters most, so for an `RGBA8`-formatted texture, the size of each component (a byte), and the fact that there's four of them, matters a great deal. DirectX allows you to cast between differing formats, as long as this relationship is maintained.

These differences seem somewhat arbitrary, because whether you're using a buffer, or a texture, if you want to use them as a resource to your shader, you need to create a *Shader Resource View*. These views tell the GPU which part of your resource to access. Way back when, you'd only have textures as inputs to your shaders, and the Shader Resource View would be implicit, and covering the whole texture. 

