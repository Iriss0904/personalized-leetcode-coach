import { OnboardingForm } from "@/features/onboarding/onboarding-form";

export default function OnboardingPage() {
  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-6xl items-center justify-center">
        <OnboardingForm />
      </div>
    </main>
  );
}
