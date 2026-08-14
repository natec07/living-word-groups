"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Church, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { AvatarUpload } from "@/components/profile/avatar-upload";
import { completeOnboardingAction } from "@/server/actions/onboarding";

const MINISTRY_TOPICS = [
  "Sermons & Teaching",
  "Worship",
  "Youth Ministry",
  "Young Adults",
  "Men's Ministry",
  "Women's Ministry",
  "Prayer",
  "Outreach & Missions",
  "Bible School",
];

const STEPS = ["Welcome", "Guidelines", "About you", "Interests", "Groups", "Notifications", "Finish"] as const;

export function OnboardingWizard({
  profile,
  ministries,
  openGroups,
}: {
  profile: { firstName: string; lastName: string; bio: string; ageRange: string; avatarUrl: string | null };
  ministries: { id: string; name: string }[];
  openGroups: { id: string; name: string; description: string | null }[];
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [pending, startTransition] = useTransition();

  const [agreed, setAgreed] = useState(false);
  const [firstName, setFirstName] = useState(profile.firstName);
  const [lastName, setLastName] = useState(profile.lastName);
  const [bio, setBio] = useState(profile.bio);
  const [ageRange, setAgeRange] = useState(profile.ageRange);
  const [interests, setInterests] = useState<string[]>([]);
  const [joinGroupIds, setJoinGroupIds] = useState<string[]>([]);
  const [frequency, setFrequency] = useState<"IMMEDIATE" | "DAILY_DIGEST" | "OFF">("IMMEDIATE");

  const last = step === STEPS.length - 1;
  const aboutYouValid = firstName.trim().length > 0 && lastName.trim().length > 0;

  function next() {
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }
  function back() {
    setStep((s) => Math.max(s - 1, 0));
  }
  function toggle(list: string[], setList: (v: string[]) => void, value: string) {
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  }

  function finish() {
    startTransition(async () => {
      await completeOnboardingAction({
        agreeToGuidelines: true,
        firstName,
        lastName,
        bio: bio || undefined,
        ageRange: (ageRange || undefined) as Parameters<typeof completeOnboardingAction>[0]["ageRange"],
        ministryInterests: interests,
        joinGroupIds,
        notificationFrequency: frequency,
      });
      router.push("/home");
      router.refresh();
    });
  }

  return (
    <div>
      <Progress value={((step + 1) / STEPS.length) * 100} className="mb-8" />

      {step === 0 && (
        <StepShell icon={Church} title="Welcome to Living Word Community" description="Let's get your account set up — this will only take a minute.">
          <p className="text-muted-foreground">
            We&apos;ll ask a few quick questions to personalize your feed, help you find your people, and
            get your notifications dialed in just right.
          </p>
        </StepShell>
      )}

      {step === 1 && (
        <StepShell title="Community guidelines" description="A quick agreement before you dive in.">
          <div className="max-h-56 overflow-y-auto rounded-lg border border-border bg-secondary/30 p-4 text-sm text-muted-foreground">
            <p>Living Word Community is a space to encourage one another, share honestly, and grow together in Christ.</p>
            <ul className="mt-3 list-disc space-y-1 pl-4">
              <li>Speak with kindness, even in disagreement.</li>
              <li>Keep others&apos; prayer requests and testimonies confidential.</li>
              <li>No harassment, spam, or promotion of unrelated businesses.</li>
              <li>Report anything that concerns you — leaders review every report.</li>
            </ul>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <Checkbox id="agree" checked={agreed} onCheckedChange={(c) => setAgreed(c === true)} />
            <Label htmlFor="agree" className="font-normal">I agree to the community guidelines</Label>
          </div>
        </StepShell>
      )}

      {step === 2 && (
        <StepShell title="Tell us about you" description="This is what other members will see on your profile.">
          <div className="space-y-5">
            <AvatarUpload currentUrl={profile.avatarUrl} firstName={firstName} lastName={lastName} />
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="ob-first-name">First name</Label>
                <Input id="ob-first-name" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ob-last-name">Last name</Label>
                <Input id="ob-last-name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ob-bio">Bio</Label>
              <Textarea
                id="ob-bio"
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="A short intro for other members"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Age range</Label>
              <Select value={ageRange} onValueChange={(v) => setAgeRange(v ?? "")}>
                <SelectTrigger><SelectValue placeholder="Select a range" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="YOUTH">Youth</SelectItem>
                  <SelectItem value="YOUNG_ADULT">Young adult</SelectItem>
                  <SelectItem value="ADULT">Adult</SelectItem>
                  <SelectItem value="SENIOR">Senior</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </StepShell>
      )}

      {step === 3 && (
        <StepShell title="What are you interested in?" description="Select ministries and content to personalize your feed.">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {[...ministries.map((m) => m.name), ...MINISTRY_TOPICS.filter((t) => !ministries.some((m) => m.name.includes(t)))]
              .filter((v, i, arr) => arr.indexOf(v) === i)
              .map((topic) => (
                <div key={topic} className="flex items-center gap-2 rounded-lg border border-border p-3">
                  <Checkbox
                    id={topic}
                    checked={interests.includes(topic)}
                    onCheckedChange={() => toggle(interests, setInterests, topic)}
                  />
                  <Label htmlFor={topic} className="font-normal">{topic}</Label>
                </div>
              ))}
          </div>
        </StepShell>
      )}

      {step === 4 && (
        <StepShell title="Discover groups" description="Join a few open groups to start connecting right away.">
          <div className="space-y-2">
            {openGroups.map((g) => (
              <div key={g.id} className="flex items-start gap-2 rounded-lg border border-border p-3">
                <Checkbox
                  id={g.id}
                  checked={joinGroupIds.includes(g.id)}
                  onCheckedChange={() => toggle(joinGroupIds, setJoinGroupIds, g.id)}
                />
                <Label htmlFor={g.id} className="flex flex-col font-normal">
                  <span className="font-medium text-foreground">{g.name}</span>
                  {g.description && <span className="text-sm text-muted-foreground">{g.description}</span>}
                </Label>
              </div>
            ))}
            {openGroups.length === 0 && <p className="text-muted-foreground">No open groups yet — you can browse groups anytime.</p>}
          </div>
        </StepShell>
      )}

      {step === 5 && (
        <StepShell title="Notification preferences" description="How often should we email you?">
          <RadioGroup value={frequency} onValueChange={(v) => setFrequency(v as typeof frequency)} className="gap-3">
            {[
              { value: "IMMEDIATE", label: "Immediately", desc: "Email me as things happen" },
              { value: "DAILY_DIGEST", label: "Daily digest", desc: "One email per day with a summary" },
              { value: "OFF", label: "Off", desc: "In-app only, no emails" },
            ].map((opt) => (
              <div key={opt.value} className="flex items-center gap-2 rounded-lg border border-border p-3">
                <RadioGroupItem value={opt.value} id={opt.value} />
                <Label htmlFor={opt.value} className="flex flex-col font-normal">
                  <span className="font-medium text-foreground">{opt.label}</span>
                  <span className="text-sm text-muted-foreground">{opt.desc}</span>
                </Label>
              </div>
            ))}
          </RadioGroup>
        </StepShell>
      )}

      {last && (
        <StepShell icon={Sparkles} title="You're all set!" description="Welcome to the family — let's head to your home feed.">
          <p className="text-muted-foreground">
            You can always update your interests, groups, and notification settings later from your profile.
          </p>
        </StepShell>
      )}

      <div className="mt-8 flex items-center justify-between">
        <Button variant="ghost" onClick={back} disabled={step === 0 || pending}>
          Back
        </Button>
        {last ? (
          <Button onClick={finish} disabled={pending}>
            {pending ? "Finishing…" : "Go to my home feed"}
          </Button>
        ) : (
          <Button onClick={next} disabled={(step === 1 && !agreed) || (step === 2 && !aboutYouValid)}>
            {step === STEPS.length - 2 ? "Review" : "Continue"}
          </Button>
        )}
      </div>
    </div>
  );
}

function StepShell({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
      {Icon && <Icon className="mb-3 h-8 w-8 text-primary" />}
      <h1 className="text-2xl font-semibold">{title}</h1>
      <p className="mt-1 text-muted-foreground">{description}</p>
      <div className="mt-6">{children}</div>
    </div>
  );
}
