---
layout: post
title: Canonical Hello World
---

This is the first post of my blog. There are many like it, but this one is mine.

### Overview

This blog is mainly going to be documenting my journey in writing a voxel-based graphics engine (called [shiny][shiny]). This isn't my first trip to the rodeo, but it is the first time I've done anything with voxels. My first goal is to replicate Cyril Crassin et al.'s thesis [*Gigavoxels*][crassin_gigavoxels], in DirectX 11. I currently have a Sparse Voxel Octree... viewer thing. It correctly displays a non-mip-mapped 3D texture (the bricks) by navigating an octree, stored in a buffer, in the fragment shader. Using Shader Model 5, of course. So, that's nice. Next will be writing a voxelization tool to voxelize polygonal models, and then completing the Gigavoxels implementation. After that... who knows.

I will probably also write about C++ stuff in general. Like how sweet lambdas are.

### Voxelization

There are several recent publications regarding voxelization, most notably Baert, Lagae, and Dutrè's [*Out-of-Core Construction of Sparse Voxel Octrees*][ooc], Crassin and Green's [*Sparse Voxelization*][crassin_voxelization], and Rauwendaal and Bailey's [*Hybrid Computational Voxeization Using the Graphics Pipeline*][rauwenbailey]. I'm currently just trying to wrap my head around how easy it will be to merge their approaches to get an out-of-core voxelisation tool that utilizes the graphics pipeline for serious throughput. My gut feeling is: totally doable.

### Gigavoxels

The step afterwards requires writing the interface for the atomic buffer operations, after which I can begin to implement the remainder of Gigavoxels. I don't even understand the buffer read/write mechanism described in the thesis, about loading data asychronously on-demand. But that's a while away. I intend to document the architecture of the engine in this blog. I'll also probably write out my (re-)discoveries about voxels along the way, mainly to solidify my understanding.

[shiny]: http://github.com/omnigoat/shiny
[crassin_gigavoxels]: http://maverick.inria.fr/Membres/Cyril.Crassin/thesis/CCrassinThesis_EN_Web.pdf
[crassin_voxelization]: http://www.seas.upenn.edu/~pcozzi/OpenGLInsights/OpenGLInsights-SparseVoxelization.pdf
[ooc]: [http://people.cs.kuleuven.be/~ares.lagae/publications/BLD13OCCSVO/BLD13OCCSVO.pdf]
[rauwenbailey]: http://jcgt.org/published/0002/01/02/paper.pdf
