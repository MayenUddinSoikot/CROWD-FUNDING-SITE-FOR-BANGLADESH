/* The streamer overlay.

   A creator adds this URL to OBS as a Browser Source and every donation
   to their campaigns pops up on the stream.

   Served as a plain HTML document from a route handler rather than a
   page, on purpose: a page would be wrapped in the site layout, header
   and footer and all, and an overlay has to be nothing but a
   transparent sheet with one card on it.

   Everything the page shows comes from ./feed, and every value from it
   is written with textContent — a donor name or message is whatever a
   stranger typed, and it is going on camera. */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PAGE = String.raw`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Shohay alerts</title>
<style>
  :root { color-scheme: light; }
  html, body {
    margin: 0; padding: 0; width: 100%; height: 100%;
    background: transparent; overflow: hidden;
    font-family: "Plus Jakarta Sans", -apple-system, "Segoe UI", Roboto,
      system-ui, sans-serif;
  }
  #stage {
    position: absolute; inset: 0;
    display: flex; flex-direction: column; justify-content: flex-end;
    padding: 32px; gap: 16px; box-sizing: border-box;
  }
  #stage.right { align-items: flex-end; }
  #stage.top { justify-content: flex-start; }

  .alert {
    display: flex; align-items: center; gap: 18px;
    max-width: 620px;
    padding: 20px 28px;
    border-radius: 22px;
    background: linear-gradient(135deg, #11694a, #0b4f36);
    box-shadow: 0 18px 48px rgba(0, 0, 0, 0.35);
    color: #fff;
    opacity: 0;
    transform: translateY(24px) scale(0.96);
    animation: pop 420ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
  }
  .alert.out { animation: away 380ms ease forwards; }
  @keyframes pop {
    to { opacity: 1; transform: translateY(0) scale(1); }
  }
  @keyframes away {
    to { opacity: 0; transform: translateY(-14px) scale(0.97); }
  }

  .heart { font-size: 40px; line-height: 1; }
  .lines { min-width: 0; }
  .who { font-size: 27px; font-weight: 800; letter-spacing: -0.3px; }
  .who b { color: #ffd97a; }
  .msg {
    margin-top: 6px; font-size: 21px; line-height: 1.35;
    color: rgba(255,255,255,0.92);
    display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .what {
    margin-top: 6px; font-size: 16px; font-weight: 600;
    color: rgba(255,255,255,0.62);
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }

  #bar {
    display: none; align-items: baseline; gap: 14px;
    align-self: flex-start;
    padding: 14px 24px; border-radius: 999px;
    background: rgba(11, 79, 54, 0.92);
    box-shadow: 0 10px 30px rgba(0,0,0,0.3);
    color: #fff;
  }
  #stage.right #bar { align-self: flex-end; }
  #bar.on { display: flex; }
  #bar .amount { font-size: 30px; font-weight: 800; }
  #bar .label { font-size: 16px; color: rgba(255,255,255,0.7); }
</style>
</head>
<body>
<div id="stage"><div id="bar"><span class="amount" id="barAmount">Tk 0</span><span class="label" id="barLabel">raised today</span></div></div>
<script>
(function () {
  var stage = document.getElementById("stage");
  var bar = document.getElementById("bar");
  var barAmount = document.getElementById("barAmount");
  var barLabel = document.getElementById("barLabel");

  var params = new URLSearchParams(location.search);
  if (params.get("align") === "right") stage.classList.add("right");
  if (params.get("position") === "top") stage.classList.add("top");
  var showBar = params.get("bar") === "1";
  var showTotal = params.get("total") === "all";
  if (showBar) bar.classList.add("on");

  // Only donations that land from now on should pop. Without this the
  // whole history would fire the moment the stream starts.
  var since = new Date().toISOString();
  var seen = Object.create(null);
  var queue = [];
  var showing = false;
  var HOLD = 7000;

  function taka(n) {
    return "Tk " + Math.round(Number(n) || 0).toLocaleString("en-US");
  }

  function render(d) {
    var el = document.createElement("div");
    el.className = "alert";

    var heart = document.createElement("div");
    heart.className = "heart";
    heart.textContent = "\u{1F49A}";

    var lines = document.createElement("div");
    lines.className = "lines";

    var who = document.createElement("div");
    who.className = "who";
    // textContent throughout: this is a stranger's words, on camera.
    who.appendChild(document.createTextNode((d.donor || "Someone") + " gave "));
    var amt = document.createElement("b");
    amt.textContent = taka(d.amount);
    who.appendChild(amt);
    lines.appendChild(who);

    if (d.message) {
      var msg = document.createElement("div");
      msg.className = "msg";
      msg.textContent = "“" + d.message + "”";
      lines.appendChild(msg);
    }
    if (d.campaign_title) {
      var what = document.createElement("div");
      what.className = "what";
      what.textContent = d.campaign_title;
      lines.appendChild(what);
    }

    el.appendChild(heart);
    el.appendChild(lines);
    return el;
  }

  function next() {
    if (showing || queue.length === 0) return;
    showing = true;
    var el = render(queue.shift());
    stage.appendChild(el);
    setTimeout(function () {
      el.classList.add("out");
      setTimeout(function () {
        if (el.parentNode) el.parentNode.removeChild(el);
        showing = false;
        next();
      }, 400);
    }, HOLD);
  }

  function poll() {
    fetch("./feed?since=" + encodeURIComponent(since), { cache: "no-store" })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        (data.donations || []).forEach(function (d) {
          if (seen[d.id]) return;
          seen[d.id] = 1;
          if (d.paid_at && d.paid_at > since) since = d.paid_at;
          queue.push(d);
        });
        next();

        if (showBar) {
          var value = showTotal ? data.raised_total : data.raised_today;
          barAmount.textContent = taka(value);
          barLabel.textContent = showTotal ? "raised on Shohay" : "raised today";
        }
      })
      .catch(function () { /* a stream never shows an error */ });
  }

  poll();
  setInterval(poll, 5000);
})();
</script>
</body>
</html>`;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ key: string }> }
) {
  const { key } = await params;
  if (!key || key.length < 24) {
    return new Response("Not found", { status: 404 });
  }

  return new Response(PAGE, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
      // The URL is the secret; keep it out of search results.
      "x-robots-tag": "noindex, nofollow",
    },
  });
}
