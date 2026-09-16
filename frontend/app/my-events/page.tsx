import { redirect } from "next/navigation";

export default function MyEventsRedirectPage() {
  redirect("/dashboard?tab=my-events");
}
