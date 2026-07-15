import { Save, Sparkles } from "lucide-react";
import Link from "next/link";
import { AppLayout } from "@/components/layout/app-layout";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { TagChip } from "@/components/shared/tag-chip";
import { Button } from "@/components/ui/button";
import { onboardingOptions } from "@/features/onboarding/profile-defaults";
import { updateProfileSelections } from "@/features/profile/actions";
import {
  getProfilePageData,
  type ProfileSkillRow,
} from "@/features/profile/profile-data";
import { skillStatusBadgeClass, skillStatusBarClass } from "@/lib/ui-status";

export const dynamic = "force-dynamic";

type ProfilePageProps = {
  searchParams?: Promise<{ saved?: string }>;
};

export default async function ProfilePage({ searchParams }: ProfilePageProps) {
  const [data, params] = await Promise.all([getProfilePageData(), searchParams]);
  const saved = params?.saved === "1";

  return (
    <AppLayout displayName={data.displayName}>
      <PageHeader
        title="Skill Profile"
        description="Synthesized strengths, weaknesses, and common mistakes from your reviews."
        actions={
          <Button asChild variant="outline">
            <Link href="#edit-signals">Edit Signals</Link>
          </Button>
        }
      />

      {saved ? (
        <div className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          Profile preferences saved.
        </div>
      ) : null}

      <section className="mt-6 rounded-lg border border-border bg-[#f9f7ec] p-5">
        <div className="flex items-center gap-2 text-primary">
          <Sparkles className="h-4 w-4" aria-hidden="true" />
          <h2 className="text-sm font-semibold">Coach Synthesis</h2>
        </div>
        {data.latestSynthesis ? (
          <p className="mt-3 text-sm leading-7 text-foreground/90">
            {data.latestSynthesis}
          </p>
        ) : (
          <p className="mt-3 text-sm leading-7 text-muted-foreground">
            No cross-problem synthesis yet. Review a few problems and the coach
            will summarize your evolving profile here.
          </p>
        )}
        <p className="mt-3 text-xs text-muted-foreground">
          {data.recentlyUpdatedFrom
            ? `Updated from ${data.recentlyUpdatedFrom.problemTitle} · ${formatDate(
                data.recentlyUpdatedFrom.createdAt,
              )}`
            : "Awaiting first review-backed update."}
        </p>
      </section>

      <section className="mt-6 grid gap-5 lg:grid-cols-2">
        <Card title="Skill Graph">
          <div className="grid gap-4">
            {data.skillProfile.map((skill) => (
              <SkillRow key={skill.name} skill={skill} />
            ))}
          </div>
        </Card>

        <Card title="Common Mistakes">
          {data.commonMistakes.length > 0 ? (
            <div className="grid gap-2">
              {data.commonMistakes.map((mistake) => (
                <details
                  className="rounded-md border border-border bg-background"
                  key={mistake.tag}
                >
                  <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-2 px-3 py-2.5">
                    <span className="flex items-center gap-2">
                      <span className="rounded-md border border-rose-200 bg-rose-50 px-1.5 py-0.5 text-xs font-medium text-rose-700">
                        ×{mistake.evidenceCount}
                      </span>
                      <span className="text-sm font-semibold">
                        {mistake.label}
                      </span>
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatPercent(mistake.confidence)}
                    </span>
                  </summary>
                  <div className="border-t border-border px-3 py-3">
                    {mistake.lastEvidenceSummary ? (
                      <p className="text-sm leading-6 text-muted-foreground">
                        {mistake.lastEvidenceSummary}
                      </p>
                    ) : null}
                    <p className="mt-2 text-xs text-muted-foreground">
                      {mistake.problemTitle ?? "Local memory"} ·{" "}
                      {formatDate(mistake.lastSeenAt)}
                    </p>
                  </div>
                </details>
              ))}
            </div>
          ) : (
            <p className="rounded-md border border-dashed border-border px-3 py-6 text-sm text-muted-foreground">
              No diagnosed mistakes yet.
            </p>
          )}
          <Link
            className="mt-3 inline-block text-xs font-medium text-primary hover:underline"
            href="/notebook"
          >
            View full Mistake Book →
          </Link>
        </Card>
      </section>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <PreferenceCard title="Preferred Languages" values={data.preferredLanguages} />
        <PreferenceCard title="Current Strengths" values={data.strongPatterns} />
        <PreferenceCard title="Current Weaknesses" values={data.weakPatterns} />
        <PreferenceCard title="Output Preference" values={data.outputPreferences} />
      </section>

      <section className="mt-6" id="edit-signals">
        <Card title="Edit Profile Signals">
          <form action={updateProfileSelections} className="grid gap-5">
            <EditableCheckboxGroup
              name="strongPatterns"
              options={onboardingOptions.strongPatterns}
              selected={data.strongPatterns}
              title="Strong Patterns"
            />
            <EditableCheckboxGroup
              name="weakPatterns"
              options={onboardingOptions.weakPatterns}
              selected={data.weakPatterns}
              title="Weak Patterns"
            />
            <EditableCheckboxGroup
              name="outputPreferences"
              options={onboardingOptions.outputPreferences}
              selected={data.outputPreferences}
              title="Output Preference"
            />
            <div className="border-t border-border pt-4">
              <Button type="submit">
                <Save className="h-4 w-4" aria-hidden="true" />
                Save Profile
              </Button>
            </div>
          </form>
        </Card>
      </section>
    </AppLayout>
  );
}

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="border-b border-border px-5 py-3">
        <h2 className="text-sm font-semibold">{title}</h2>
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}

function SkillRow({ skill }: { skill: ProfileSkillRow }) {
  const percent = skill.confidence === null ? 0 : Math.round(skill.confidence * 100);

  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold">{skill.name}</span>
        <span className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {skill.confidence === null ? "—" : `${percent}%`}
          </span>
          <StatusBadge
            className={skillStatusBadgeClass(skill.status)}
            label={skill.status}
          />
        </span>
      </div>
      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full ${skillStatusBarClass(skill.status)}`}
          style={{ width: `${Math.max(percent, skill.confidence === null ? 0 : 4)}%` }}
        />
      </div>
      <p className="mt-1.5 text-xs text-muted-foreground">
        {skill.source}
        {skill.evidenceCount > 0 ? ` · ${skill.evidenceCount} evidence` : ""}
      </p>
    </div>
  );
}

function PreferenceCard({
  title,
  values,
}: {
  title: string;
  values: string[];
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {title}
      </h3>
      <div className="mt-2 flex flex-wrap gap-2">
        {values.length > 0 ? (
          values.map((value) => <TagChip key={value} label={value} />)
        ) : (
          <span className="text-xs text-muted-foreground">None set</span>
        )}
      </div>
    </div>
  );
}

function EditableCheckboxGroup({
  name,
  options,
  selected,
  title,
}: {
  name: string;
  options: readonly string[];
  selected: string[];
  title: string;
}) {
  return (
    <fieldset className="grid gap-3">
      <legend className="text-sm font-semibold">{title}</legend>
      <div className="grid gap-2 sm:grid-cols-2">
        {options.map((option) => (
          <label
            className="flex min-h-10 items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm"
            key={option}
          >
            <input
              className="h-4 w-4 accent-primary"
              defaultChecked={selected.includes(option)}
              name={name}
              type="checkbox"
              value={option}
            />
            <span>{option}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}
