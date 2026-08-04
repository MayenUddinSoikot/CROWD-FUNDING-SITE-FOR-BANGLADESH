// Builds one profile per real PERSON who has ever created a campaign
// (any type — fundraiser, birthday, creator). Campaigns are grouped by
// login account first, then groups are merged whenever they share an
// email, phone number, or NID/Passport/Birth-certificate number — so
// someone who comes back years later with a new account but the same
// identity lands in the same profile.

export type MergeCampaign = {
  id: string;
  creator_id: string | null;
  title: string;
  raised_amount: number;
  status: string;
  created_at: string;
  campaign_no?: number | null;
  slug?: string;
};

export type MergeVerification = {
  campaign_id: string;
  applicant_name: string | null;
  applicant_email: string | null;
  applicant_phone: string | null;
  applicant_nid: string | null;
  bkash_number?: string | null;
  bank_name?: string | null;
  bank_account_number?: string | null;
};

export type MergeProfile = {
  id: string;
  full_name: string | null;
  phone: string | null;
  display_name?: string | null;
  username?: string | null;
};

export type PersonProfile = {
  key: string;
  accountIds: string[];
  names: string[];
  emails: string[];
  phones: string[];
  nids: string[];
  payoutMethods: string[];
  usernames: string[];
  campaigns: MergeCampaign[];
  totalRaised: number;
  firstSeen: string;
};

const normEmail = (v: string) => v.trim().toLowerCase();
const normPhone = (v: string) => {
  const digits = v.replace(/\D/g, "");
  // Treat 8801XXXXXXXXX and 01XXXXXXXXX as the same number.
  return digits.length > 11 ? digits.slice(-11) : digits;
};
const normNid = (v: string) => v.replace(/\s/g, "").toLowerCase();

class UnionFind {
  private parent = new Map<string, string>();

  find(x: string): string {
    let root = this.parent.get(x) ?? x;
    if (root !== x) {
      root = this.find(root);
      this.parent.set(x, root);
    }
    return root;
  }

  union(a: string, b: string): void {
    const ra = this.find(a);
    const rb = this.find(b);
    if (ra !== rb) this.parent.set(rb, ra);
  }
}

export function mergePeople(
  campaigns: MergeCampaign[],
  verifications: MergeVerification[],
  profiles: MergeProfile[]
): PersonProfile[] {
  const verificationByCampaign = new Map(
    verifications.map((v) => [v.campaign_id, v])
  );
  const profileById = new Map(profiles.map((p) => [p.id, p]));

  // Group key per campaign: its login account, or itself if none.
  const groupOf = (c: MergeCampaign) => c.creator_id ?? `anon-${c.id}`;

  const uf = new UnionFind();
  const seenIdentifier = new Map<string, string>();

  for (const c of campaigns) {
    const group = groupOf(c);
    const v = verificationByCampaign.get(c.id);
    const p = c.creator_id ? profileById.get(c.creator_id) : undefined;

    const identifiers: string[] = [];
    if (v?.applicant_email) identifiers.push(`e:${normEmail(v.applicant_email)}`);
    if (v?.applicant_phone) identifiers.push(`p:${normPhone(v.applicant_phone)}`);
    if (p?.phone) identifiers.push(`p:${normPhone(p.phone)}`);
    if (v?.applicant_nid) identifiers.push(`n:${normNid(v.applicant_nid)}`);

    for (const idKey of identifiers) {
      const existing = seenIdentifier.get(idKey);
      if (existing) uf.union(existing, group);
      else seenIdentifier.set(idKey, group);
    }
  }

  // Collect merged groups.
  const byRoot = new Map<string, PersonProfile>();
  const push = (list: string[], value: string | null | undefined) => {
    const trimmed = (value ?? "").trim();
    if (trimmed && !list.includes(trimmed)) list.push(trimmed);
  };

  for (const c of campaigns) {
    const root = uf.find(groupOf(c));
    let person = byRoot.get(root);
    if (!person) {
      person = {
        key: root,
        accountIds: [],
        names: [],
        emails: [],
        phones: [],
        nids: [],
        payoutMethods: [],
        usernames: [],
        campaigns: [],
        totalRaised: 0,
        firstSeen: c.created_at,
      };
      byRoot.set(root, person);
    }

    const v = verificationByCampaign.get(c.id);
    const p = c.creator_id ? profileById.get(c.creator_id) : undefined;

    if (c.creator_id && !person.accountIds.includes(c.creator_id)) {
      person.accountIds.push(c.creator_id);
    }
    push(person.names, p?.display_name);
    push(person.names, p?.full_name);
    push(person.names, v?.applicant_name);
    push(person.emails, v?.applicant_email);
    push(person.phones, v?.applicant_phone);
    push(person.phones, p?.phone);
    push(person.nids, v?.applicant_nid);
    push(person.usernames, p?.username);
    if (v?.bkash_number) {
      push(person.payoutMethods, `bKash/Nagad ${v.bkash_number}`);
    }
    if (v?.bank_name && v.bank_account_number) {
      push(person.payoutMethods, `${v.bank_name} a/c ${v.bank_account_number}`);
    }

    person.campaigns.push(c);
    person.totalRaised += Number(c.raised_amount);
    if (c.created_at < person.firstSeen) person.firstSeen = c.created_at;
  }

  return [...byRoot.values()].sort((a, b) => b.totalRaised - a.totalRaised);
}

// Find the merged person a given account (or group key) belongs to.
export function findPerson(
  people: PersonProfile[],
  id: string
): PersonProfile | null {
  return (
    people.find((p) => p.key === id || p.accountIds.includes(id)) ?? null
  );
}
