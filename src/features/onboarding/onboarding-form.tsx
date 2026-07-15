"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Check, SkipForward } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { saveOnboardingProfile, skipOnboarding } from "./actions";
import { onboardingOptions, publicDefaultProfile } from "./profile-defaults";
import { onboardingSchema, type OnboardingFormValues } from "./schema";

type CheckboxGroupProps = {
  label: string;
  options: readonly string[];
  values: string[];
  onChange: (values: string[]) => void;
  error?: string;
};

function CheckboxGroup({
  label,
  options,
  values,
  onChange,
  error,
}: CheckboxGroupProps) {
  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-medium text-foreground">{label}</legend>
      <div className="grid gap-2 sm:grid-cols-2">
        {options.map((option) => {
          const checked = values.includes(option);

          return (
            <label
              className={cn(
                "flex min-h-11 cursor-pointer items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm transition-colors",
                checked && "border-primary bg-primary/10 text-primary",
              )}
              key={option}
            >
              <input
                checked={checked}
                className="h-4 w-4 accent-primary"
                onChange={(event) => {
                  if (event.target.checked) {
                    onChange([...values, option]);
                  } else {
                    onChange(values.filter((value) => value !== option));
                  }
                }}
                type="checkbox"
              />
              <span>{option}</span>
            </label>
          );
        })}
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </fieldset>
  );
}

export function OnboardingForm() {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const {
    formState: { errors },
    handleSubmit,
    register,
    setValue,
    control,
  } = useForm<OnboardingFormValues>({
    defaultValues: publicDefaultProfile,
    resolver: zodResolver(onboardingSchema),
  });

  const preferredLanguages =
    useWatch({ control, name: "preferredLanguages" }) ?? [];
  const strongPatterns = useWatch({ control, name: "strongPatterns" }) ?? [];
  const weakPatterns = useWatch({ control, name: "weakPatterns" }) ?? [];
  const explanationStyle =
    useWatch({ control, name: "explanationStyle" }) ?? [];
  const outputPreferences =
    useWatch({ control, name: "outputPreferences" }) ?? [];

  const submit = handleSubmit((formValues: OnboardingFormValues) => {
    setMessage(null);
    startTransition(async () => {
      const result = await saveOnboardingProfile(formValues);

      if (result.ok) {
        router.push("/today");
        return;
      }

      setMessage(result.message ?? "Could not save the profile.");
    });
  });

  const skip = () => {
    setMessage(null);
    startTransition(async () => {
      const result = await skipOnboarding();

      if (result.ok) {
        router.push("/today");
        return;
      }

      setMessage(result.message ?? "Could not apply the default profile.");
    });
  };

  return (
    <Card className="w-full max-w-5xl">
      <CardHeader className="border-b border-border">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">
              PatternCoach AI setup
            </p>
            <CardTitle className="mt-1 text-2xl">Initial Coach Profile</CardTitle>
          </div>
          <Button
            aria-label="Skip onboarding"
            disabled={isPending}
            onClick={skip}
            type="button"
            variant="outline"
          >
            <SkipForward className="h-4 w-4" aria-hidden="true" />
            Skip
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-5">
        <form className="grid gap-6" onSubmit={submit}>
          <div className="grid gap-5 lg:grid-cols-2">
            <label className="grid gap-2">
              <span className="text-sm font-medium">Display Name</span>
              <Input {...register("displayName")} />
              {errors.displayName ? (
                <span className="text-sm text-destructive">
                  {errors.displayName.message}
                </span>
              ) : null}
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-medium">Interview Goal</span>
              <select
                className="h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                {...register("interviewGoal")}
              >
                {onboardingOptions.interviewGoals.map((goal) => (
                  <option key={goal.value} value={goal.value}>
                    {goal.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <CheckboxGroup
            error={errors.preferredLanguages?.message}
            label="Preferred Languages"
            onChange={(nextValues) =>
              setValue("preferredLanguages", nextValues, {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
            options={onboardingOptions.languages}
            values={preferredLanguages}
          />

          <div className="grid gap-6 lg:grid-cols-2">
            <CheckboxGroup
              error={errors.strongPatterns?.message}
              label="Strong Patterns"
              onChange={(nextValues) =>
                setValue("strongPatterns", nextValues, {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
              options={onboardingOptions.strongPatterns}
              values={strongPatterns}
            />
            <CheckboxGroup
              error={errors.weakPatterns?.message}
              label="Weak Patterns"
              onChange={(nextValues) =>
                setValue("weakPatterns", nextValues, {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
              options={onboardingOptions.weakPatterns}
              values={weakPatterns}
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <CheckboxGroup
              error={errors.explanationStyle?.message}
              label="Preferred Explanation Style"
              onChange={(nextValues) =>
                setValue("explanationStyle", nextValues, {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
              options={onboardingOptions.explanationStyles}
              values={explanationStyle}
            />
            <CheckboxGroup
              error={errors.outputPreferences?.message}
              label="Output Preference"
              onChange={(nextValues) =>
                setValue("outputPreferences", nextValues, {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
              options={onboardingOptions.outputPreferences}
              values={outputPreferences}
            />
          </div>

          {message ? <p className="text-sm text-destructive">{message}</p> : null}

          <div className="flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:justify-end">
            <Button disabled={isPending} type="submit">
              <Check className="h-4 w-4" aria-hidden="true" />
              Save Profile
            </Button>
            <Button
              disabled={isPending}
              onClick={() => router.push("/workbench")}
              type="button"
              variant="ghost"
            >
              Skip to Workbench
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
