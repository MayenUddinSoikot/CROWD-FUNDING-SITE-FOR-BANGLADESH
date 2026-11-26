/* Plain writing from the admin, rendered as a readable page.

   Deliberately not a rich-text editor. Someone running a charity
   should be able to paste what their lawyer sent and have it look
   right, without learning anything: blank line for a new paragraph, a
   line ending in a colon or question mark becomes a sub-heading, and
   a line starting with - or • becomes a bullet. */

export function Prose({ text }: { text: string }) {
  const blocks = text
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .filter(Boolean);

  return (
    <div className="mt-6 space-y-5">
      {blocks.map((block, i) => {
        const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);

        const bulleted = lines.every((l) => /^[-•*]\s+/.test(l));
        if (bulleted) {
          return (
            <ul key={i} className="space-y-2 pl-1">
              {lines.map((line, j) => (
                <li key={j} className="flex gap-3 leading-relaxed text-body">
                  <span aria-hidden="true" className="font-bold text-brand">
                    ·
                  </span>
                  <span>{line.replace(/^[-•*]\s+/, "")}</span>
                </li>
              ))}
            </ul>
          );
        }

        const [first, ...rest] = lines;
        const isHeading =
          lines.length > 1 && (first.endsWith(":") || first.endsWith("?"));

        if (isHeading) {
          return (
            <section key={i}>
              <h2 className="text-lg font-bold sm:text-xl">
                {first.replace(/:$/, "")}
              </h2>
              <p className="mt-2 whitespace-pre-line leading-relaxed text-body">
                {rest.join("\n")}
              </p>
            </section>
          );
        }

        return (
          <p key={i} className="whitespace-pre-line leading-relaxed text-body">
            {block}
          </p>
        );
      })}
    </div>
  );
}
