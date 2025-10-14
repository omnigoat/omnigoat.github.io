document.addEventListener("DOMContentLoaded", () =>
{
    
    var minimap = document.querySelector(".minimap");
    var sizer = document.querySelector(".minimap .sizer");
    var controller = document.querySelector(".minimap .controller");
    var contents = document.querySelector(".minimap .contents");
    var scroll_target = document.querySelector("section.content section.posts");

    // width ratio from content -> minimap
    var w = 1;
    
    // is mouse/touch down
    var down = !1;
    
    // last position for scrolling
    var scroll_position = 0;
    var controller_has_capture = false;

    function reposition_controller()
    {
        let remap = (window.innerHeight / minimap.offsetHeight);
        let scroll_percentage = window.scrollY / (document.body.clientHeight - window.innerHeight);
        let scroll_range = (window.innerHeight - controller.clientHeight * remap);
        let d = scroll_percentage * scroll_range / remap;

        controller.style.transform = `translate(0px, ${d}px)`;
    }

    function align_contents()
    {
        let t = document.body.clientHeight * w - window.innerHeight;
        
        if (t <= 0)
        {
            contents.style.top = "0px";
        }
        else
        {
            console.log(window.scrollY, document.body.clientHeight, window.innerHeight);
            let delta = window.scrollY / (document.body.clientHeight - window.innerHeight);
            delta = (delta > 1 ? 1 : delta);
            console.log(`delta: ${delta}`);
            t *= delta;
            contents.style.top = `-${t}px`;
        }

        reposition_controller();
    }

    function resize_minimap()
    {
        //w = minimap.clientWidth / scroll_target.clientWidth;
        w = minimap.clientWidth / scroll_target.offsetWidth;

        var o = scroll_target.offsetHeight / scroll_target.offsetWidth;

        //sizer.style.paddingTop = 100 * o + "%";
        sizer.style.paddingTop = o * minimap.clientWidth + "px";
        contents.style.height = 100 / w + "%";
        contents.style.width = 100 / w + "%";
        contents.style.transform = `scale(${w})`;

        controller.style.width = minimap.clientWidth + "px";
        controller.style.height = "120px";

        align_contents();
    }
 
    function controller_down(e)
    {
        e.preventDefault();
        controller_has_capture = true;
        //let x = e.touches ? e.touches[0].clientX : e.clientX;
        let y = e.touches ? e.touches[0].clientY : e.clientY;
        scroll_position = y;
        let r = controller.getBoundingClientRect();
        if (y < r.top)
        {
            y = y / 2 + r.top / 2;
        }
        else
        {
            if (!(y > r.bottom))
                return void (down = !0);
            y = y / 2 + r.top / 2
        }
        scroll_position = y;
        down = i.top < g && i.bottom > g;
        let d = y / window.innerHeight * document.body.clientHeight;
        window.scrollTo(0, d)
    }

    function controller_move(e)
    {
        const x = e.touches ? e.touches[0].clientX : e.clientX;
        const y = e.touches ? e.touches[0].clientY : e.clientY;
        let c = controller.getBoundingClientRect();
        let r  = minimap.getBoundingClientRect();

        // colourize the controller
        if (down || c.left <= x && x <= c.right && c.top <= y && y <= c.bottom)
        {
            controller.style.opacity = 0.1;
        }
        else if (r.left <= x && x <= r.right && r.top <= y && y <= r.bottom)
        {
            controller.style.opacity = 0.2;
        }
        else
        {
            controller.style.opacity = 0;
        }

        // don't perform drag scrolling if we weren't down
        if (!down)
            return;
        e.preventDefault();
        
        // don't perform scrolling if we were outside the minimap
        if (y < r.top || r.bottom < y)
        {
            controller_has_capture = false;
            return;
        }

        // update mouse-delta of drag
        var delta = (y - scroll_position);
        scroll_position = y;

        // ensure recapture occurs within the middle two-quarters
        if (!controller_has_capture)
        {
            const c1qt = c.top + c.height / 4;
            const c3qt = c.top + c.height * 3 / 4;

            if (y <= c3qt && c1qt <= y)
            {
                controller_has_capture = true;
            }
            else
            {
                return;
            }
        }

        window.scrollBy(0, delta / minimap.offsetHeight * document.body.scrollHeight);
    }

    function controller_up()
    {
        down = !1;
    }

    function mouseleave()
    {
        controller_has_capture = false;
    }

    window.addEventListener("resize", resize_minimap);
    window.addEventListener("scroll", align_contents);

    controller.addEventListener("mousedown", controller_down);
    controller.addEventListener("touchdown", controller_down);

    window.addEventListener("mousemove", controller_move);
    window.addEventListener("touchmove", controller_move);
    window.addEventListener("mouseup", controller_up);
    window.addEventListener("touchup", controller_up);
    document.body.addEventListener("mouseleave", mouseleave);
    document.body.addEventListener("touchleave", mouseleave);

    resize_minimap();
});