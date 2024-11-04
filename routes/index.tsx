import { useSignal } from "@preact/signals";
import Schedule from "../islands/Schedule.tsx";

export default function Home() {
  return (
    <div class="px-4 py-8 mx-auto bg-[#86efac]">
      <div class="max-w-screen-md mx-auto flex flex-col items-center justify-center">
        <img
          class="my-6"
          src="/logo.svg"
          width="128"
          height="128"
          alt="the Fresh logo: a sliced lemon dripping with juice"
        />
        <h1 class="text-4xl font-bold">Lemon Calendar</h1>
        <p class="my-4">
          Enter a valid iCalendar URL below to receive a Discord-ready formatted
          weekly schedule.
        </p>
        <Schedule />
      </div>
    </div>
  );
}
