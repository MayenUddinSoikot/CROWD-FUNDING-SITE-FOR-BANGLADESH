"use client";

import { useActionState, useState } from "react";
import { addAnnouncement } from "./actions";
import { Button, Card, inputClass } from "@/components/ui";

export function AnnouncementForm() {
  const [state, action, pending] = useActionState(addAnnouncement, undefined);

  // Controlled, so a validation error never wipes what was typed.
  const [message, setMessage] = useState("");
  const [messageBn, setMessageBn] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [tone, setTone] = useState("normal");

  const [handled, setHandled] = useState(state);
  if (state !== handled) {
    setHandled(state);
    if (state?.saved) {
      setMessage("");
      setMessageBn("");
      setLinkUrl("");
      setTone("normal");
    }
  }

  return (
    <Card className="p-5 sm:p-6">
      <form action={action}>
        <h2 className="text-sm font-bold text-brand">Add a message</h2>
        <p className="mt-1.5 text-xs leading-relaxed text-muted">
          Keep it short — it shows in capitals at the top of every page and
          rotates every four seconds. Three at a time, maximum.
        </p>

        <label className="mt-4 block text-sm font-medium" htmlFor="message">
          Message (English)
        </label>
        <input
          id="message"
          name="message"
          required
          maxLength={120}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="0% platform fee — every taka reaches the campaign"
          className={inputClass}
        />
        <p className="mt-1 text-xs text-muted">{message.length}/120</p>

        <label
          className="font-bengali mt-3 block text-sm font-medium"
          htmlFor="message_bn"
        >
          একই বার্তা বাংলায় <span className="font-sans">(optional)</span>
        </label>
        <input
          id="message_bn"
          name="message_bn"
          maxLength={120}
          value={messageBn}
          onChange={(e) => setMessageBn(e.target.value)}
          className={`font-bengali ${inputClass}`}
        />
        <p className="mt-1 text-xs text-muted">
          Shown beside the English on wider screens.
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium" htmlFor="link_url">
              Link (optional)
            </label>
            <input
              id="link_url"
              name="link_url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="/creators"
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium" htmlFor="tone">
              Colour
            </label>
            <select
              id="tone"
              name="tone"
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              className={inputClass}
            >
              <option value="normal">Green — everyday</option>
              <option value="urgent">Red — emergency appeal only</option>
            </select>
          </div>
        </div>

        {tone === "urgent" ? (
          <p className="mt-3 rounded-xl bg-warn-tint px-4 py-3 text-xs leading-relaxed text-warn-ink">
            Red turns the whole bar red. Use it for a flood or emergency
            appeal and switch it off afterwards — a red bar that is always on
            stops meaning anything.
          </p>
        ) : null}

        {state?.error ? (
          <p className="mt-4 rounded-xl bg-accent-tint px-4 py-3 text-sm font-medium text-accent-ink">
            {state.error}
          </p>
        ) : null}
        {state?.saved ? (
          <p className="mt-4 rounded-xl bg-brand-tint px-4 py-3 text-sm font-medium text-brand-dark">
            Added — it&rsquo;s at the top of the site now.
          </p>
        ) : null}

        <Button type="submit" disabled={pending} className="mt-5">
          {pending ? "Saving…" : "Add message"}
        </Button>
      </form>
    </Card>
  );
}
