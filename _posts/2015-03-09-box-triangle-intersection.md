---
layout: post
title: The Difficult Second Update
---

So I burnt out a bit towards the end of last year, just as I started this blog - perhaps because I did. Either way, it went dead. And that isn't cool. But now I'm back, ready to continue working on [shiny][shiny], voxelizing things. This post is going to basically be a bit of an algorithm/code dump. But that's cool, because it's hard to find this stuff explained online.

### Triangle-AABB Intersections

Finding a modern algorithm for AABB-triangle intersection wasn't terribly difficult. All the major papers I have previously mentioned (in my only other blog post to date) reference the same one: [Fast Parallel Surface and Solid Voxelization on GPUs - Schwarz-Seidel 2010][schwarz_seidel]. As their paper mentions, this algorithm expands into fewer instructions than the standard Seperating Axis Theorem-based algorithm, by [Akenine-Möller][akemol]. The SAT-based algorithm is the easiest thing to find on the web when you search for triangle-box intersection. It's also crazy-full of macros. I can't imagine anyone uses it without modifying it first.

For now, I've decided to first generate Sparse Voxel Octrees "offline". For you kids not in the know, that means before the application runs - a build step. After I get that all working, I'll try and GPU-accelerate it. Eventually, ideally, the voxelization pipeline will be flexible enough to voxelize large data-sets offline, and smaller objects in real-time, a la Crassin et al. But first we need to correctly intersect boxes and triangles.

### The Algorithm, An Explanation

This algorithm is nice because it allows for a bunch of per-triangle setup to be done, and then minimal intructions performed per-voxel. 

So, referencing our [paper][schwarz_seidel], I'll outline how it works very quickly:

 * Take the box, and the bounding-box of the triangle, and check if they overlap. If they don't, no intersection.
 * Take the plane the triangle lies upon and test to see if it intersects the box. If it doesn't, no intersection.
 * For each axis-plane (xy, yz, zx), project the box and the triangle onto the plane, and see if they overlap. If any don't, no intersection.

Step 1 is incredibly obvious and is performed in every algorithm I ever saw. Step 2 requires calculating something called the *critical point*, in relation to the triangle-normal. If you imagine a light being shone from very far away, in the direction of the triangle-normal, then the critical-point would be the first (closest) point hit by the incoming light. Honestly it was easy to blindly implement Step 2 so I didn't really pay much attention. Step 3 was *far* more difficult, because of how Schwarz & Seidel decided to write their paper. Rather than continue describing the algorithm in abstract, they instead describe the rest of the per-axis-plane algorithm in terms of the xy-plane. Which would be fine, save for that they don't mention which other two planes should also be implemented. So silly old me implemented the xy-plane, the xz-plane, and the yz-plane. Spot the error? Yeah, it should be the zx-plane, not the xz-plane. I still don't know why that's important, but it's the difference between happiness and sadness.

### The Algorithm, Implementation

Here I've just code-dumped the algorithm in C++. I think it's readable enough. Keep in mind I use homogenous coordinates (points have 1.f in the w-component, vectors have 0.f). I haven't yet figured out how to format it nicely so it scrolls horizontally yet.

{% highlight c++ %}
//
//  some things to note:
//    - aabc_t is an axis-aligned-bounding-cube
//    - point4f is a function that returns a vector4f with the w-component set to 1.f
//    - I'll probably refactor to give triangle_t a normal() function, and make a function for
//      bounding-box intersection.
//
auto intersect_aabc_triangle2(aabc_t const& box, triangle_t const& tri) -> bool
{
	auto p  = box.min_point();
	auto pm = box.max_point();

	// triangle bounding-box
	auto tmin2 = point4f(std::min(tri.v0.x, tri.v1.x), std::min(tri.v0.y, tri.v1.y), std::min(tri.v0.z, tri.v1.z));
	auto tmin  = point4f(std::min(tri.v2.x, tmin2.x), std::min(tri.v2.y, tmin2.y), std::min(tri.v2.z, tmin2.z));
	auto tmax2 = point4f(std::max(tri.v0.x, tri.v1.x), std::max(tri.v0.y, tri.v1.y), std::max(tri.v0.z, tri.v1.z));
	auto tmax  = point4f(std::max(tri.v2.x, tmax2.x), std::max(tri.v2.y, tmax2.y), std::max(tri.v2.z, tmax2.z));

	// bounding-box test
	if (tmax.x < p.x || tmax.y < p.y || tmax.z < p.z || pm.x < tmin.x || pm.y < tmin.y || pm.z < tmin.z)
		return false;

	// triangle-normal
	auto n = vector4f{cross_product(tri.edge0(), tri.edge1()).normalized()};
	
	// delta-p, the vector of (min-point, max-point) of the bounding-box
	vector4f dp = box.max_point() - p;

	// test for triangle-plane/box overlap
	auto c = point4f(
		n.x > 0.f ? dp.x : 0.f,
		n.y > 0.f ? dp.y : 0.f,
		n.z > 0.f ? dp.z : 0.f);

	auto d1 = dot_product(n, c - tri.v0);
	auto d2 = dot_product(n, dp - c - tri.v0);

	if ((dot_product(n, p) + d1) * (dot_product(n, p) + d2) > 0.f)
		return false;


	// xy-plane projection-overlap
	vector4f ne0xy = vector4f{-tri.edge0().y, tri.edge0().x, 0.f, 0.f} * (n.z < 0.f ? -1.f : 1.f);
	vector4f ne1xy = vector4f{-tri.edge1().y, tri.edge1().x, 0.f, 0.f} * (n.z < 0.f ? -1.f : 1.f);
	vector4f ne2xy = vector4f{-tri.edge2().y, tri.edge2().x, 0.f, 0.f} * (n.z < 0.f ? -1.f : 1.f);

	auto v0xy = math::vector4f{tri.v0.x, tri.v0.y, 0.f, 0.f};
	auto v1xy = math::vector4f{tri.v1.x, tri.v1.y, 0.f, 0.f};
	auto v2xy = math::vector4f{tri.v2.x, tri.v2.y, 0.f, 0.f};

	float de0xy = -dot_product(ne0xy, v0xy) + std::max(0.f, dp.x * ne0xy.x) + std::max(0.f, dp.y * ne0xy.y);
	float de1xy = -dot_product(ne1xy, v1xy) + std::max(0.f, dp.x * ne1xy.x) + std::max(0.f, dp.y * ne1xy.y);
	float de2xy = -dot_product(ne2xy, v2xy) + std::max(0.f, dp.x * ne2xy.x) + std::max(0.f, dp.y * ne2xy.y);

	auto pxy = vector4f(p.x, p.y, 0.f, 0.f);

	if ((dot_product(ne0xy, pxy) + de0xy) < 0.f || (dot_product(ne1xy, pxy) + de1xy) < 0.f || (dot_product(ne2xy, pxy) + de2xy) < 0.f)
		return false;


	// yz-plane projection overlap
	vector4f ne0yz = vector4f{-tri.edge0().z, tri.edge0().y, 0.f, 0.f} * (n.x < 0.f ? -1.f : 1.f);
	vector4f ne1yz = vector4f{-tri.edge1().z, tri.edge1().y, 0.f, 0.f} * (n.x < 0.f ? -1.f : 1.f);
	vector4f ne2yz = vector4f{-tri.edge2().z, tri.edge2().y, 0.f, 0.f} * (n.x < 0.f ? -1.f : 1.f);

	auto v0yz = math::vector4f{tri.v0.y, tri.v0.z, 0.f, 0.f};
	auto v1yz = math::vector4f{tri.v1.y, tri.v1.z, 0.f, 0.f};
	auto v2yz = math::vector4f{tri.v2.y, tri.v2.z, 0.f, 0.f};

	float de0yz = -dot_product(ne0yz, v0yz) + std::max(0.f, dp.y * ne0yz.x) + std::max(0.f, dp.z * ne0yz.y);
	float de1yz = -dot_product(ne1yz, v1yz) + std::max(0.f, dp.y * ne1yz.x) + std::max(0.f, dp.z * ne1yz.y);
	float de2yz = -dot_product(ne2yz, v2yz) + std::max(0.f, dp.y * ne2yz.x) + std::max(0.f, dp.z * ne2yz.y);

	auto pyz = vector4f(p.y, p.z, 0.f, 0.f);

	if ((dot_product(ne0yz, pyz) + de0yz) < 0.f || (dot_product(ne1yz, pyz) + de1yz) < 0.f || (dot_product(ne2yz, pyz) + de2yz) < 0.f)
		return false;


	// zx-plane projection overlap
	vector4f ne0zx = vector4f{-tri.edge0().x, tri.edge0().z, 0.f, 0.f} * (n.y < 0.f ? -1.f : 1.f);
	vector4f ne1zx = vector4f{-tri.edge1().x, tri.edge1().z, 0.f, 0.f} * (n.y < 0.f ? -1.f : 1.f);
	vector4f ne2zx = vector4f{-tri.edge2().x, tri.edge2().z, 0.f, 0.f} * (n.y < 0.f ? -1.f : 1.f);

	auto v0zx = math::vector4f{tri.v0.z, tri.v0.x, 0.f, 0.f};
	auto v1zx = math::vector4f{tri.v1.z, tri.v1.x, 0.f, 0.f};
	auto v2zx = math::vector4f{tri.v2.z, tri.v2.x, 0.f, 0.f};

	float de0zx = -dot_product(ne0zx, v0zx) + std::max(0.f, dp.y * ne0zx.x) + std::max(0.f, dp.z * ne0zx.y);
	float de1zx = -dot_product(ne1zx, v1zx) + std::max(0.f, dp.y * ne1zx.x) + std::max(0.f, dp.z * ne1zx.y);
	float de2zx = -dot_product(ne2zx, v2zx) + std::max(0.f, dp.y * ne2zx.x) + std::max(0.f, dp.z * ne2zx.y);

	auto pzx = vector4f(p.z, p.x, 0.f, 0.f);

	if ((dot_product(ne0zx, pzx) + de0zx) < 0.f || (dot_product(ne1zx, pzx) + de1zx) < 0.f || (dot_product(ne2zx, pzx) + de2zx) < 0.f)
		return false;


	return true;
}
{% endhighlight %}

[shiny]: http://github.com/omnigoat/shiny
[schwarz_seidel]: http://research.michael-schwarz.com/publ/files/vox-siga10.pdf
[akemol]: http://fileadmin.cs.lth.se/cs/Personal/Tomas_Akenine-Moller/code/


