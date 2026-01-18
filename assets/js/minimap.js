document.addEventListener("DOMContentLoaded", () =>
{
	var minimap = document.querySelector(".minimap");
	var sizer = document.querySelector(".minimap .sizer");
	var controller = document.querySelector(".minimap .controller");
	var contents = document.querySelector(".minimap .contents");
	var scroll_target = document.querySelector("div.inner-contents");


	// width ratio from scroll-target -> minimap
	var w = 1;
	// ratio from "natural height" of minimap to the height that fits into the window
	var wy = 1;

	// is mouse/touch down
	var down = !1;

	// last position for scrolling
	var scroll_position = 0;
	var controller_has_capture = false;

	// -1=above, 1=below, 0=within
	var outside_minimap = 0;

	function visible_height(element)
	{
		const r = element.getBoundingClientRect();
		const h1 = Math.min(r.height, window.innerHeight - r.top);
		const h2 = Math.min(r.bottom, window.innerHeight);
		return Math.max(0, r.top > 0 ? h1 : h2);
	}

	function reposition_controller()
	{
		const visible_minimap_height = visible_height(minimap);
		const c = controller.getBoundingClientRect();

		const scroll_percentage = window.scrollY / (document.body.scrollHeight - window.innerHeight);
		const d = scroll_percentage * (visible_minimap_height - c.height);
		controller.style.transform = `translate(0px, ${d}px)`;
	}

	function align_contents()
	{
		reposition_controller();

		let t = scroll_target.scrollHeight * w - window.innerHeight;

		if (t <= 0)
		{
			contents.style.top = "0px";
		}
		else
		{
			let delta = window.scrollY / (document.body.clientHeight - window.innerHeight);
			delta = delta > 1 ? 1 : delta;
			t *= delta;
			contents.style.top = `0px`;
		}

		reposition_controller();
	}

	function resize_minimap()
	{
		w = minimap.clientWidth / scroll_target.offsetWidth;

		const mmh = scroll_target.clientHeight * w;

		// set to 1 for interesting results
		wy = window.innerHeight / mmh;

		var o = scroll_target.offsetHeight / scroll_target.offsetWidth;

		//sizer.style.paddingTop = 100 * o + "%";
		sizer.style.paddingTop = o * minimap.clientWidth * wy + "px";
		//contents.style.height = (100 / w) * wy + "%";
		contents.style.width = 100 / w + "%";
		contents.style.transform = `scale(${w}, ${w * wy})`;

		const k = window.innerHeight / scroll_target.offsetWidth;

		controller.style.width = minimap.clientWidth + "px";
		controller.style.height = minimap.clientWidth * k * wy + "px";

		align_contents();
	}

	function controller_down(e)
	{
		e.preventDefault();

		let y = e.touches ? e.touches[0].clientY : e.clientY;

		let r = minimap.getBoundingClientRect();
		let c = controller.getBoundingClientRect();

		scroll_position = y;
		down = true;
		outside_minimap = 0;

		// mouse on controller, we're dragging
		if (c.top <= y && y <= c.bottom) {
			controller_has_capture = true;
			return;
		}
		// move to very top
		else if (y < r.top + c.height / 2) {
			window.scrollTo(0, 0);
		}
		// move to very bottom
		else if (y > r.bottom - c.height / 2) {
			window.scrollTo(0, document.body.scrollHeight);
		}
		// move arbitrarily elsewhere
		else {
			const mh = visible_height(minimap);
			window.scrollTo(
				0,
				((y - c.height / 2) / mh) * document.body.scrollHeight,
			);
		}

		controller.style.opacity = 0.1;
	}

	function controller_move(e)
	{
		const x = e.touches ? e.touches[0].clientX : e.clientX;
		const y = e.touches ? e.touches[0].clientY : e.clientY;
		let c = controller.getBoundingClientRect();
		let r = minimap.getBoundingClientRect();

		// colourize the controller
		if (down || (c.left <= x && x <= c.right && c.top <= y && y <= c.bottom))
		{
			controller.style.opacity = 0.5;
		}
		else if (r.left <= x && x <= r.right && r.top <= y && y <= r.bottom)
		{
			controller.style.opacity = 0.5;
		}
		else
		{
			controller.style.opacity = 0.2;
		}

		// don't perform drag scrolling if we weren't down
		if (!down)
			return;

		e.preventDefault();

		// ensure recapture occurs within the middle
		if (!controller_has_capture)
		{
			const c1qt = c.top + c.height / 2.1;
			const c3qt = c.bottom - c.height / 2.1;

			if ((outside_minimap === -1 && y > c1qt) ||
				(outside_minimap === 1 && y < c3qt) ||
				outside_minimap === 0)
			{
				controller_has_capture = true;
			}
			else
			{
				scroll_position = y;
				return;
			}
		}

		// don't perform scrolling if we were outside the minimap
		const minimap_visible_top = Math.min(0, r.top);
		const minimap_visible_height = visible_height(minimap);
		if (y < minimap_visible_top || minimap_visible_height < y)
		{
			controller_has_capture = false;
			outside_minimap = y < minimap_visible_top ? -1 : minimap_visible_height < y ? 1 : 0;
			return;
		}

		// update mouse-delta of drag
		var delta = y - scroll_position;
		window.scrollBy(0, (delta / visible_height(minimap)) * document.body.scrollHeight);

		scroll_position = y;
	}

	function controller_up()
	{
		down = !1;
		controller_has_capture = false;
	}

	function mouseleave()
	{
		controller_has_capture = false;
	}

	window.addEventListener("resize", resize_minimap);
	window.addEventListener("scroll", align_contents);

	minimap.addEventListener("mousedown", controller_down);
	minimap.addEventListener("touchdown", controller_down);

	window.addEventListener("mousemove", controller_move);
	window.addEventListener("touchmove", controller_move);
	window.addEventListener("mouseup", controller_up);
	window.addEventListener("touchup", controller_up);
	document.body.addEventListener("mouseleave", mouseleave);
	document.body.addEventListener("touchleave", mouseleave);

	resize_minimap();
});
