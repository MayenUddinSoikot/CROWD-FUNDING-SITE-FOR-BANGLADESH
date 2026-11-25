import { ImageResponse } from "next/og";
import QRCode from "qrcode";

/* The ready-made post images.

   Satori (what ImageResponse draws with) supports only a subset of CSS:
   flexbox, no grid, no `inset` shorthand, and every element holding more
   than one child needs an explicit display. Keep changes inside those
   lines or the whole image 500s.

   Latin-only on purpose: ImageResponse ships one built-in Latin face,
   so amounts read "Tk 12,000" rather than using ৳, which would draw as
   an empty box. */

export const CARD_SIZES = {
  story: { width: 1080, height: 1920 },
  square: { width: 1080, height: 1080 },
  og: { width: 1200, height: 630 },
} as const;

export type CardFormat = keyof typeof CARD_SIZES;

const BRAND = "#11694a";
const BRAND_DARK = "#0b4f36";
const CREAM = "#faf6ee";
const INK = "#141a13";

function taka(n: number): string {
  return `Tk ${Math.round(n).toLocaleString("en-US")}`;
}

export async function renderShareCard({
  format,
  title,
  district,
  raised,
  goal,
  coverImageUrl,
  shareUrl,
  via,
}: {
  format: CardFormat;
  title: string;
  district: string | null;
  raised: number;
  goal: number;
  coverImageUrl: string | null;
  shareUrl: string;
  via: string | null;
}): Promise<ImageResponse> {
  const size = CARD_SIZES[format] ?? CARD_SIZES.story;
  const { width, height } = size;

  const safeGoal = goal > 0 ? goal : 1;
  const percent = Math.max(
    0,
    Math.min(100, Math.round((raised / safeGoal) * 100))
  );

  // Heavy enough to still scan off a phone screen someone is filming.
  const qr = await QRCode.toDataURL(shareUrl, {
    errorCorrectionLevel: "M",
    margin: 1,
    width: 320,
    color: { dark: "#141a13", light: "#ffffff" },
  });

  const tall = format === "story";
  const wide = format === "og";

  const titleSize = wide ? 52 : tall ? 74 : 62;
  const padding = wide ? 56 : 72;
  const qrSize = wide ? 150 : tall ? 230 : 196;
  // Without a photo the band is just a flat green slab, so it shrinks to
  // a header strip and the title leads instead.
  const photoHeight = wide
    ? height
    : coverImageUrl
      ? tall
        ? 820
        : 420
      : tall
        ? 300
        : 210;

  const shown = title.length > 84 ? `${title.slice(0, 84)}…` : title;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: wide ? BRAND_DARK : CREAM,
          fontFamily: "sans-serif",
        }}
      >
        {/* Photo band. On the wide card it sits behind everything. */}
        <div
          style={{
            display: "flex",
            position: wide ? "absolute" : "relative",
            top: 0,
            left: 0,
            width: wide ? `${width}px` : "100%",
            height: `${photoHeight}px`,
            backgroundColor: BRAND_DARK,
            overflow: "hidden",
          }}
        >
          {coverImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={coverImageUrl}
              alt=""
              width={width}
              height={photoHeight}
              style={{
                width: `${width}px`,
                height: `${photoHeight}px`,
                objectFit: "cover",
              }}
            />
          ) : null}
        </div>

        {/* Dim the photo on the wide card so the words carry. */}
        {wide ? (
          <div
            style={{
              display: "flex",
              position: "absolute",
              top: 0,
              left: 0,
              width: `${width}px`,
              height: `${height}px`,
              backgroundColor: "rgba(11,79,54,0.84)",
            }}
          />
        ) : null}

        {/* Wordmark */}
        <div
          style={{
            display: "flex",
            position: "absolute",
            top: `${padding - 20}px`,
            left: `${padding}px`,
            alignItems: "center",
            padding: "12px 26px",
            borderRadius: 999,
            backgroundColor: "rgba(250,246,238,0.95)",
          }}
        >
          <div
            style={{
              fontSize: wide ? 26 : 32,
              fontWeight: 700,
              color: BRAND,
              letterSpacing: 4,
            }}
          >
            SHOHAY
          </div>
          <div
            style={{
              marginLeft: 16,
              fontSize: wide ? 18 : 22,
              color: "#5b6459",
            }}
          >
            0% fee
          </div>
        </div>

        {/* Words */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flexGrow: 1,
            padding: `${padding}px`,
            paddingTop: wide ? `${padding + 48}px` : `${padding - 12}px`,
            color: wide ? CREAM : INK,
          }}
        >
          {/* With no photo there is a lot of empty card, so the words
              float towards the middle instead of clinging to the top. */}
          {!coverImageUrl && !wide ? (
            <div style={{ display: "flex", flexGrow: 1 }} />
          ) : null}

          <div
            style={{
              display: "flex",
              fontSize: titleSize,
              fontWeight: 700,
              lineHeight: 1.15,
              letterSpacing: -1.5,
              maxWidth: wide ? "60%" : "100%",
            }}
          >
            {shown}
          </div>

          {district ? (
            <div
              style={{
                display: "flex",
                marginTop: 16,
                fontSize: wide ? 24 : 32,
                color: wide ? "rgba(250,246,238,0.8)" : "#5b6459",
              }}
            >
              {district}
            </div>
          ) : null}

          <div style={{ display: "flex", flexGrow: 1 }} />

          {/* Progress */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                display: "flex",
                alignItems: "flex-end",
                justifyContent: "space-between",
                width: wide ? "60%" : "100%",
              }}
            >
              <div
                style={{
                  display: "flex",
                  fontSize: wide ? 44 : 56,
                  fontWeight: 700,
                  color: wide ? CREAM : BRAND,
                }}
              >
                {taka(raised)}
              </div>
              <div
                style={{
                  display: "flex",
                  fontSize: wide ? 24 : 30,
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
                width: wide ? "60%" : "100%",
                borderRadius: 999,
                backgroundColor: wide ? "rgba(250,246,238,0.25)" : "#ede8de",
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
                display: "flex",
                marginTop: 14,
                fontSize: wide ? 22 : 28,
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
              marginTop: wide ? 30 : 52,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qr}
              alt=""
              width={qrSize}
              height={qrSize}
              style={{
                width: `${qrSize}px`,
                height: `${qrSize}px`,
                borderRadius: 16,
              }}
            />
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                marginLeft: 28,
              }}
            >
              <div
                style={{
                  display: "flex",
                  fontSize: wide ? 30 : 40,
                  fontWeight: 700,
                  color: wide ? CREAM : INK,
                }}
              >
                Scan to donate
              </div>
              <div
                style={{
                  display: "flex",
                  marginTop: 8,
                  fontSize: wide ? 22 : 28,
                  color: wide ? "rgba(250,246,238,0.8)" : "#5b6459",
                }}
              >
                shohay.org
              </div>
              {via ? (
                <div
                  style={{
                    display: "flex",
                    marginTop: 14,
                    padding: "8px 18px",
                    borderRadius: 999,
                    fontSize: wide ? 20 : 26,
                    fontWeight: 600,
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
        // Only the raised total moves, so a few minutes is plenty.
        "cache-control": "public, max-age=300, s-maxage=300",
      },
    }
  );
}
