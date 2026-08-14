import type { Metadata } from "next";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = { title: "About" };

const beliefs = [
  { title: "The Scriptures", body: "We believe the Bible is God's inspired Word and our final authority for faith and life." },
  { title: "Salvation by Grace", body: "We believe salvation is a free gift, received by faith in Jesus Christ, not by works." },
  { title: "The Holy Spirit", body: "We believe every believer is empowered by the Holy Spirit to live and serve boldly." },
  { title: "The Church", body: "We believe the local church is God's family — a place to belong, grow, and serve together." },
];

const leaders = [
  { name: "Pastor Marcus Whitfield", role: "Lead Pastor" },
  { name: "Elder Grace Amadi", role: "Elder & Bible Teacher" },
  { name: "Alana Reyes", role: "Worship Pastor" },
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
      <h1 className="text-4xl font-semibold">About Living Word Community</h1>
      <p className="mt-4 text-lg text-muted-foreground">
        Living Word Community is a local church in Rockland, NY, devoted to the teaching of Scripture,
        authentic community, and reaching our neighbors with the love of Christ. This platform is our
        digital home — a place to stay connected to church family throughout the week.
      </p>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold">What we believe</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {beliefs.map((b) => (
            <Card key={b.title}>
              <CardContent className="p-5">
                <p className="font-medium">{b.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{b.body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold">Leadership</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {leaders.map((l) => (
            <Card key={l.name}>
              <CardContent className="p-5">
                <p className="font-medium">{l.name}</p>
                <p className="text-sm text-muted-foreground">{l.role}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold">Visit us</h2>
        <p className="mt-3 text-muted-foreground">482 Cedar Grove Road, Rockland, NY</p>
        <ul className="mt-3 space-y-1 text-muted-foreground">
          <li>Sunday Morning Worship — 10:00 AM</li>
          <li>Sunday Evening Service — 6:00 PM</li>
          <li>Tuesday Morning Prayer — 6:30 AM</li>
          <li>Wednesday Bible Study — 7:00 PM</li>
        </ul>
      </section>
    </div>
  );
}
