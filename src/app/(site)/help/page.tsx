import { Hero, Section } from "@/components/page";
import { HelpSearch } from "@/components/site";
import { HELP } from "@/lib/content";
export const metadata = { title: "Help centre", description: "Answers for customers and helpers." };
export default function Page() { return (<><Hero eyebrow="Help centre" title="How can we help?" /><Section tone="white"><div className="max-w-3xl"><HelpSearch items={HELP} /></div></Section></>); }
