import { ImageResponse } from "next/og";
import QRCode from "qrcode";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/anon";
import { cleanUsername } from "@/lib/referral";

/* Ready-made images a creator can post straight to a story or feed.

   /campaigns/<slug>/share-card?format=story&via=rafsan

   Deliberately Latin-only. ImageResponse ships one built-in Latin face,
   and bundling a Bengali font would blow the 500KB route budget — so
   amounts read "Tk 12,000" rather than using the ৳ sign, which would
   come out as an empty box. */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SIZES = {
  story: { width: 1080, height: 1920 },
  square: { width: 1080, height: 1080 },
  og: { width: 1200, height: 630 },
} as const;

type Format = keyof typeof SIZES;

const BRAND = "#11694a";
const BRAND_DARK = "#0b4f36";
const CREAM = "#faf6ee";
const INK = "#141a13";

function taka(n: number): string {
  return `Tk ${Math.round(n).toLocaleString("en-US")}`;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const { searchParams, origin } = new URL(request.url);

  const formatParam = searchParams.get("format") ?? "story";
  const format: Format = (
    formatParam in SIZES ? formatParam : "story"
  ) as Format;
  const { width, height } = SIZES[format];
  const via = cleanUsername(searchParams.get("via"));

  if (!isSupabaseConfigured()) {
    return new Response("Not available", { status: 503 });
  }

  const supabase = getSupabaseClient();
  const { data } = await supabase
    .from("campaigns")
    .select("title, goal_amount, raised_amount, cover_image_url, district")
    .eq("slug", slug)
    .in("status", ["approved", "completed"])
    .maybeSingle();

  if (!data) return new Response("Not found", { status: 404 });

  const campaign = data as {
    title: string;
    goal_amount: number;
    raised_amount: number;
    cover_image_url: string | null;
    district: string | null;
  };

  const raised = Number(campaign.raised_amount) || 0;
  const goal = Number(campaign.goal_amount) || 1;
  const percent = Math.max(0, Math.min(100, Math.round((raised / goal) * 100)));

  const shareUrl = `${origin}/campaigns/${slug}${via ? `?via=${via}` : ""}`;

  // Black-on-white, heavy error correction, so it still scans off a
  // phone screen that someone is filming.
  const qr = await QRCode.toDataURL(shareUrl, {
    errorCorrectionLevel: "M",
    margin: 1,
    width: 320,
    color: { dark: "#141a13", light: "#ffffff" },
  });

  const tall = format === "story";
  const wide = format === "og";

  const titleSize = wide ? 54 : tall ? 76 : 64;
  const padding = wide ? 56 : 72;
  const qrSize = wide ? 150 : tall ? 240 : 200;
  const imageHeight = wide ? "100%" : tall ? "46%" : "40%";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: CREAM,
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        {/* Campaign photo */}
        <div
          style={{
            display: "flex",
            width: "100%",
            height: imageHeight,
            position: wide ? "absolute" : "relative",
            top: 0,
            left: 0,
            backgroundColor: BRAND_DARK,
            overflow: "hidden",
          }}
        >
          {campaign.cover_image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={campaign.cover_image_url}
              alt=""
              width={width}
              height={1200}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : null}
          {wide ? (
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                backgroundColor: "rgba(11,79,54,0.82)",
              }}
            />
          ) : null}
        </div>

        {/* Wordmark */}
        <div
          style={{
            position: "absolute",
            top: padding - 16,
            left: padding,
            display: "flex",
            alignItems: "center",
            gap: 14,
            padding: "12px 24px",
            borderRadius: 999,
            backgroundColor: "rgba(250,246,238,0.94)",
          }}
        >
          <div
            style={{
              fontSize: wide ? 26 : 32,
              fontWeight: 800,
              color: BRAND,
              letterSpacing: 4,
            }}
          >
            SHOHAY
          </div>
          <div style={{ fontSize: wide ? 18 : 22, color: "#5b6459" }}>
            0% fee
          </div>
        </div>

        {/* The words */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            padding,
            paddingTop: wide ? padding + 40 : padding - 8,
            position: "relative",
            color: wide ? CREAM : INK,
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: titleSize,
              fontWeight: 800,
              lineHeight: 1.15,
              letterSpacing: -1.5,
              maxWidth: wide ? "62%" : "100%",
            }}
          >
            {campaign.title.length > 86
              ? `${campaign.title.slice(0, 86)}…`
              : campaign.title}
          </div>

          {campaign.district ? (
            <div
              style={{
                marginTop: 16,
                fontSize: wide ? 24 : 32,
                color: wide ? "rgba(250,246,238,0.8)" : "#5b6459",
              }}
            >
              {campaign.district}
            </div>
          ) : null}

          <div style={{ display: "flex", flex: 1 }} />

          {/* Progress */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                display: "flex",
                alignItems: "flex-end",
                justifyContent: "space-between",
              }}
            >
              <div
                style={{
                  fontSize: wide ? 44 : 58,
                  fontWeight: 800,
                  color: wide ? CREAM : BRAND,
                }}
              >
                {taka(raised)}
              </div>
              <div
                style={{
                  fontSize: wide ? 24 : 32,
                  color: wide ? "rgba(250,246,238,0.8)" : "#5b6459",
                }}
              >
                of {taka(goal)}
              </div>
            </div>

            <div
              style={{
                display: "flex",
                marginTop: 18,
                height: wide ? 14 : 20,
                width: wide ? "62%" : "100%",
                borderRadius: 999,
                backgroundColor: wide ? "rgba(250,246,238,0.25)" : "#ede8de",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  display: "flex",
                  width: `${Math.max(percent, 2)}%`,
                  height: "100%",
                  borderRadius: 999,
                  backgroundColor: wide ? CREAM : BRAND,
                }}
              />
            </div>

            <div
              style={{
                marginTop: 14,
                fontSize: wide ? 22 : 30,
                fontWeight: 600,
                color: wide ? "rgba(250,246,238,0.85)" : "#41493f",
              }}
            >
              {percent}% funded
            </div>
          </div>

          {/* QR + call to action */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 28,
              marginTop: wide ? 28 : 48,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qr}
              alt=""
              width={qrSize}
              height={qrSize}
              style={{ borderRadius: 16, backgroundColor: "#fff" }}
            />
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div
                style={{
                  fontSize: wide ? 30 : 42,
                  fontWeight: 800,
                  color: wide ? CREAM : INK,
                }}
              >
                Scan to donate
              </div>
              <div
                style={{
                  marginTop: 8,
                  fontSize: wide ? 22 : 30,
                  color: wide ? "rgba(250,246,238,0.8)" : "#5b6459",
                }}
              >
                shohay.org
              </div>
              {via ? (
                <div
                  style={{
                    marginTop: 14,
                    display: "flex",
                    padding: "8px 18px",
                    borderRadius: 999,
                    fontSize: wide ? 20 : 26,
                    fontWeight: 700,
                    color: wide ? CREAM : BRAND_DARK,
                    backgroundColor: wide
                      ? "rgba(250,246,238,0.18)"
                      : "#e7f0ea",
                  }}
                >
                  shared by @{via}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    ),
    {
      width,
      height,
      headers: {
        // Safe to cache: the only thing that moves is the raised total.
        "cache-control": "public, max-age=300, s-maxage=300",
      },
    }
  );
}
