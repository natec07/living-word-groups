// Seeds the database with realistic Living Word Community content:
// roles/permissions, ministries, spaces, groups, sample users for every
// role, posts, prayer requests, a video library, events, and
// announcements. Run with `npm run db:seed`.

import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import {
  PERMISSION_KEYS,
  ROLE_DEFAULT_PERMISSIONS,
  ROLE_KEYS,
  ROLE_LABELS,
} from "../src/lib/rbac";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const DEV_PASSWORD = "LivingWord2026!";

async function hash(pw: string) {
  return bcrypt.hash(pw, 10);
}

async function main() {
  console.log("Seeding Living Word Community...");

  // ── Permissions & Roles ────────────────────────────────────────────
  const permissionRecords = await Promise.all(
    PERMISSION_KEYS.map((key) =>
      prisma.permission.upsert({
        where: { key },
        update: {},
        create: { key, category: key.split(".")[0], description: key },
      })
    )
  );
  const permissionByKey = new Map(permissionRecords.map((p) => [p.key, p]));

  const roleByKey = new Map<string, { id: string }>();
  for (const roleKey of ROLE_KEYS) {
    const role = await prisma.role.upsert({
      where: { key: roleKey },
      update: {},
      create: { key: roleKey, name: ROLE_LABELS[roleKey], isSystem: true },
    });
    roleByKey.set(roleKey, role);

    for (const permKey of ROLE_DEFAULT_PERMISSIONS[roleKey]) {
      const perm = permissionByKey.get(permKey)!;
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: role.id, permissionId: perm.id } },
        update: {},
        create: { roleId: role.id, permissionId: perm.id },
      });
    }
  }

  // ── Users ──────────────────────────────────────────────────────────
  const passwordHash = await hash(DEV_PASSWORD);

  async function makeUser(opts: {
    email: string;
    firstName: string;
    lastName: string;
    roleKeys: string[];
    status?: "ACTIVE" | "PENDING_APPROVAL" | "SUSPENDED";
    bio?: string;
    ministryInterests?: string[];
    onboarded?: boolean;
  }) {
    const user = await prisma.user.create({
      data: {
        email: opts.email,
        name: `${opts.firstName} ${opts.lastName}`,
        hashedPassword: passwordHash,
        emailVerified: new Date(),
        status: opts.status ?? "ACTIVE",
        onboardedAt: opts.onboarded === false ? null : new Date(),
        profile: {
          create: {
            firstName: opts.firstName,
            lastName: opts.lastName,
            bio: opts.bio ?? "",
            ministryInterests: opts.ministryInterests ?? [],
            avatarUrl: `https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(opts.email)}`,
          },
        },
      },
    });
    for (const roleKey of opts.roleKeys) {
      const role = roleByKey.get(roleKey)!;
      await prisma.userRole.create({ data: { userId: user.id, roleId: role.id } });
    }
    return user;
  }

  const admin = await makeUser({
    email: "admin@livingword.church",
    firstName: "Renee",
    lastName: "Coleman",
    roleKeys: ["ADMINISTRATOR", "MEMBER"],
    bio: "Operations director, keeping the trains running on time.",
  });

  const pastor = await makeUser({
    email: "pastor@livingword.church",
    firstName: "Marcus",
    lastName: "Whitfield",
    roleKeys: ["PASTOR_STAFF", "MEMBER"],
    bio: "Lead pastor at Living Word Community. Preaching grace and truth since 2009.",
  });

  const ministryLeader = await makeUser({
    email: "worship.leader@livingword.church",
    firstName: "Alana",
    lastName: "Reyes",
    roleKeys: ["MINISTRY_LEADER", "MEMBER"],
    bio: "Worship pastor. Guitar player, harmony enthusiast.",
    ministryInterests: ["Worship"],
  });

  const groupLeader = await makeUser({
    email: "group.leader@livingword.church",
    firstName: "David",
    lastName: "Okafor",
    roleKeys: ["GROUP_LEADER", "MEMBER"],
    bio: "Leads Men of Faith on Thursday nights.",
    ministryInterests: ["Men's Ministry"],
  });

  const member = await makeUser({
    email: "member@livingword.church",
    firstName: "Sarah",
    lastName: "Bennett",
    roleKeys: ["MEMBER"],
    bio: "New to the area, love connecting with our small group.",
    ministryInterests: ["Young Adults", "Worship"],
  });

  const pendingMember = await makeUser({
    email: "pending@livingword.church",
    firstName: "Jordan",
    lastName: "Price",
    roleKeys: ["MEMBER"],
    status: "PENDING_APPROVAL",
    onboarded: false,
    bio: "",
  });

  const extraMembersData = [
    ["Taylor", "Simmons"],
    ["Michael", "Chen"],
    ["Grace", "Amadi"],
    ["Elena", "Ruiz"],
    ["James", "Park"],
    ["Naomi", "Fields"],
    ["Isaac", "Thompson"],
    ["Priya", "Nair"],
    ["Caleb", "Wright"],
    ["Olivia", "Martins"],
  ];
  const extraMembers = [];
  for (const [firstName, lastName] of extraMembersData) {
    const u = await makeUser({
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
      firstName,
      lastName,
      roleKeys: ["MEMBER"],
    });
    extraMembers.push(u);
  }

  console.log(`Created ${extraMembers.length + 6} users.`);

  // ── Ministries ─────────────────────────────────────────────────────
  const ministryDefs = [
    { name: "Youth Ministry", slug: "youth-ministry" },
    { name: "Young Adults", slug: "young-adults" },
    { name: "Men's Ministry", slug: "mens-ministry" },
    { name: "Women's Ministry", slug: "womens-ministry" },
    { name: "Worship Ministry", slug: "worship-ministry" },
    { name: "Outreach & Missions", slug: "outreach-missions" },
    { name: "Prayer Ministry", slug: "prayer-ministry" },
    { name: "Media & Production", slug: "media-production" },
    { name: "Bible School", slug: "bible-school" },
  ];
  const ministries = new Map<string, { id: string }>();
  for (const m of ministryDefs) {
    const ministry = await prisma.ministry.create({
      data: { name: m.name, slug: m.slug, description: `${m.name} at Living Word Community.` },
    });
    ministries.set(m.slug, ministry);
  }
  await prisma.ministryLeader.create({
    data: { ministryId: ministries.get("worship-ministry")!.id, userId: ministryLeader.id },
  });
  await prisma.ministryLeader.create({
    data: { ministryId: ministries.get("prayer-ministry")!.id, userId: pastor.id },
  });

  // ── Spaces ─────────────────────────────────────────────────────────
  const churchWide = await prisma.space.create({
    data: {
      name: "Living Word Community",
      slug: "church-wide",
      description: "The church-wide space — announcements, discussions, and news for every member.",
      type: "CHURCH_WIDE",
      privacy: "MEMBERS_ONLY",
      guidelines: "Be kind, be encouraging, and keep Christ at the center of every conversation.",
      features: {
        discussion: true,
        chat: false,
        videos: true,
        events: true,
        resources: true,
        directory: true,
        announcements: true,
        prayer: true,
        courses: false,
      },
    },
  });

  const spaceDefs = [
    { name: "Youth Ministry", slug: "youth", ministry: "youth-ministry", privacy: "MEMBERS_ONLY" as const },
    { name: "Young Adults", slug: "young-adults", ministry: "young-adults", privacy: "MEMBERS_ONLY" as const },
    { name: "Men's Ministry", slug: "mens", ministry: "mens-ministry", privacy: "MEMBERS_ONLY" as const },
    { name: "Women's Ministry", slug: "womens", ministry: "womens-ministry", privacy: "MEMBERS_ONLY" as const },
    { name: "Worship Team", slug: "worship", ministry: "worship-ministry", privacy: "PRIVATE" as const },
    { name: "Prayer Team", slug: "prayer-team", ministry: "prayer-ministry", privacy: "PRIVATE" as const },
  ];
  const spaces = new Map<string, { id: string }>();
  spaces.set("church-wide", churchWide);
  for (const s of spaceDefs) {
    const space = await prisma.space.create({
      data: {
        name: s.name,
        slug: s.slug,
        description: `${s.name} community space for Living Word Community.`,
        type: "MINISTRY",
        privacy: s.privacy,
        ministryId: ministries.get(s.ministry)!.id,
        features: {
          discussion: true,
          chat: false,
          videos: true,
          events: true,
          resources: true,
          directory: true,
          announcements: true,
          prayer: s.slug === "prayer-team",
          courses: false,
        },
      },
    });
    spaces.set(s.slug, space);
  }

  const allActiveUsers = [admin, pastor, ministryLeader, groupLeader, member, ...extraMembers];
  for (const u of allActiveUsers) {
    await prisma.spaceMember.create({ data: { spaceId: churchWide.id, userId: u.id, role: "MEMBER" } });
  }

  // ── Groups ─────────────────────────────────────────────────────────
  const groupDefs = [
    {
      name: "Living Word Youth",
      slug: "living-word-youth",
      space: "youth",
      privacy: "APPROVAL_REQUIRED" as const,
      schedule: "Fridays, 6:30 PM",
      description: "Middle and high school students growing in faith together.",
      ageRestriction: "YOUTH" as const,
    },
    {
      name: "Young Adults",
      slug: "young-adults-group",
      space: "young-adults",
      privacy: "OPEN" as const,
      schedule: "Sundays after service",
      description: "For 18–29 year-olds navigating faith, career, and community.",
      ageRestriction: null,
    },
    {
      name: "Men of Faith",
      slug: "men-of-faith",
      space: "mens",
      privacy: "OPEN" as const,
      schedule: "Thursdays, 7:00 PM",
      description: "Brotherhood, accountability, and the Word — every Thursday night.",
      ageRestriction: null,
    },
    {
      name: "Women of the Word",
      slug: "women-of-the-word",
      space: "womens",
      privacy: "OPEN" as const,
      schedule: "Tuesdays, 10:00 AM",
      description: "A community of women studying Scripture and supporting one another.",
      ageRestriction: null,
    },
    {
      name: "Married Couples",
      slug: "married-couples",
      space: "church-wide",
      privacy: "OPEN" as const,
      schedule: "Monthly, second Saturday",
      description: "Building Christ-centered marriages through fellowship and teaching.",
      ageRestriction: null,
    },
    {
      name: "New Believers",
      slug: "new-believers",
      space: "church-wide",
      privacy: "OPEN" as const,
      schedule: "Sundays, 9:00 AM",
      description: "A gentle on-ramp for anyone new to faith or new to Living Word.",
      ageRestriction: null,
    },
    {
      name: "Prayer Team",
      slug: "prayer-team-group",
      space: "prayer-team",
      privacy: "APPROVAL_REQUIRED" as const,
      schedule: "Tuesdays, 6:30 AM",
      description: "Intercessors who commit to praying over the needs of our church family.",
      ageRestriction: null,
    },
    {
      name: "Worship Team",
      slug: "worship-team",
      space: "worship",
      privacy: "APPROVAL_REQUIRED" as const,
      schedule: "Wednesdays, 7:00 PM rehearsal",
      description: "Vocalists and musicians serving on the Sunday platform.",
      ageRestriction: null,
    },
    {
      name: "Media Team",
      slug: "media-team",
      space: "church-wide",
      privacy: "INVITE_ONLY" as const,
      schedule: "Sundays, 8:00 AM call time",
      description: "Sound, lighting, livestream, and photography volunteers.",
      ageRestriction: null,
    },
    {
      name: "Outreach Team",
      slug: "outreach-team",
      space: "church-wide",
      privacy: "OPEN" as const,
      schedule: "Monthly, third Saturday",
      description: "Serving our neighbors through food drives, cleanups, and missions.",
      ageRestriction: null,
    },
    {
      name: "Bible School Students",
      slug: "bible-school-students",
      space: "church-wide",
      privacy: "APPROVAL_REQUIRED" as const,
      schedule: "Mondays, 7:00 PM",
      description: "Current students in the Living Word Bible School extension program.",
      ageRestriction: null,
    },
  ];

  const groups = new Map<string, { id: string }>();
  for (const g of groupDefs) {
    const group = await prisma.group.create({
      data: {
        name: g.name,
        slug: g.slug,
        description: g.description,
        meetingSchedule: g.schedule,
        location: "Main Campus",
        privacy: g.privacy,
        ageRestriction: g.ageRestriction,
        spaceId: spaces.get(g.space)?.id,
        rules: "Be respectful, keep group discussions confidential, and come ready to grow.",
      },
    });
    groups.set(g.slug, group);

    if (g.privacy === "APPROVAL_REQUIRED") {
      await prisma.groupMembershipQuestion.createMany({
        data: [
          { groupId: group.id, order: 0, question: "Why would you like to join this group?" },
          { groupId: group.id, order: 1, question: "Are you currently attending Living Word Church?" },
          { groupId: group.id, order: 2, question: "What is your age range?" },
          { groupId: group.id, order: 3, question: "Would you like a leader to contact you?", required: false },
        ],
      });
    }
  }

  await prisma.groupMember.create({
    data: { groupId: groups.get("men-of-faith")!.id, userId: groupLeader.id, role: "LEADER" },
  });
  await prisma.groupMember.create({
    data: { groupId: groups.get("worship-team")!.id, userId: ministryLeader.id, role: "LEADER" },
  });
  await prisma.groupMember.create({
    data: { groupId: groups.get("young-adults-group")!.id, userId: member.id, role: "MEMBER" },
  });
  await prisma.groupMember.create({
    data: { groupId: groups.get("men-of-faith")!.id, userId: extraMembers[0].id, role: "MEMBER" },
  });
  await prisma.groupMember.create({
    data: { groupId: groups.get("new-believers")!.id, userId: extraMembers[1].id, role: "MEMBER" },
  });
  await prisma.groupMember.create({
    data: { groupId: groups.get("women-of-the-word")!.id, userId: extraMembers[2].id, role: "MEMBER" },
  });
  await prisma.groupMember.create({
    data: { groupId: groups.get("outreach-team")!.id, userId: extraMembers[3].id, role: "MEMBER" },
  });

  // ── Posts, comments, reactions ─────────────────────────────────────
  const post1 = await prisma.post.create({
    data: {
      authorId: pastor.id,
      spaceId: churchWide.id,
      type: "ANNOUNCEMENT",
      title: "Join us this Sunday",
      body: "Join us this Sunday as we gather in faith, worship, and expectation. Doors open at 9:30 AM, service begins at 10:00 AM. Bring a friend!",
      pinned: true,
    },
  });

  const post2 = await prisma.post.create({
    data: {
      authorId: member.id,
      spaceId: churchWide.id,
      type: "QUESTION",
      title: "What Scripture has encouraged you this week?",
      body: "I've been sitting in Psalm 34 this week — 'I sought the Lord, and he answered me.' What's been speaking to you lately?",
    },
  });

  const post3 = await prisma.post.create({
    data: {
      authorId: extraMembers[2].id,
      spaceId: churchWide.id,
      type: "TESTIMONY",
      title: "God's faithfulness this month",
      body: "I have seen God's faithfulness in a new way this month. I'm thankful for everyone who stood with me in prayer. What felt impossible in January is now behind me — He is so good.",
    },
  });

  await prisma.post.create({
    data: {
      authorId: groupLeader.id,
      groupId: groups.get("men-of-faith")!.id,
      type: "STANDARD",
      title: "This week's reading",
      body: "We're continuing in James chapter 2 this Thursday. Come ready to discuss faith and works — bring your questions!",
      pinned: true,
    },
  });

  await prisma.comment.create({
    data: {
      postId: post2.id,
      authorId: extraMembers[4].id,
      body: "Romans 8:28 has been on repeat for me lately. Great question!",
    },
  });
  const parentComment = await prisma.comment.create({
    data: {
      postId: post2.id,
      authorId: extraMembers[5].id,
      body: "Isaiah 40:31 — waiting on the Lord and renewed strength. Needed that reminder this week.",
    },
  });
  await prisma.comment.create({
    data: {
      postId: post2.id,
      authorId: member.id,
      parentId: parentComment.id,
      body: "That's a good word, thank you for sharing!",
    },
  });

  for (const [post, users, type] of [
    [post1, [member, extraMembers[0], extraMembers[1], extraMembers[2]], "AMEN"],
    [post2, [extraMembers[3], extraMembers[4]], "ENCOURAGED"],
    [post3, [pastor, admin, member, extraMembers[6]], "PRAISE_GOD"],
  ] as const) {
    for (const u of users) {
      await prisma.reaction.create({ data: { postId: post.id, userId: u.id, type } });
    }
  }

  // ── Prayer requests ────────────────────────────────────────────────
  const prayer1 = await prisma.prayerRequest.create({
    data: {
      authorId: member.id,
      title: "Wisdom for an important decision",
      details: "Please pray for wisdom and direction as I make an important decision this week regarding a job offer.",
      category: "GUIDANCE",
      urgency: "MEDIUM",
      privacy: "PUBLIC",
      status: "PRAYING",
    },
  });
  await prisma.prayerInteraction.createMany({
    data: [admin, pastor, extraMembers[0], extraMembers[1]].map((u) => ({
      prayerRequestId: prayer1.id,
      userId: u.id,
    })),
  });
  await prisma.prayerRequest.update({ where: { id: prayer1.id }, data: { prayerCount: 4 } });

  await prisma.prayerRequest.create({
    data: {
      authorId: extraMembers[6].id,
      title: "Healing for my mother",
      details: "My mother is recovering from surgery. Please pray for a smooth recovery and for peace for our family.",
      category: "HEALTH",
      urgency: "HIGH",
      privacy: "GROUP",
      groupId: groups.get("men-of-faith")!.id,
      status: "NEW",
    },
  });

  const prayer3 = await prisma.prayerRequest.create({
    data: {
      authorId: extraMembers[7].id,
      title: "A personal struggle I'm walking through",
      details: "I'm dealing with something I'm not ready to share publicly, but I need prayer and wisdom. Please keep me in your prayers this week.",
      category: "OTHER",
      urgency: "HIGH",
      privacy: "CONFIDENTIAL",
      concealName: true,
      status: "NEW",
    },
  });
  await prisma.pastoralCareNote.create({
    data: {
      prayerRequestId: prayer3.id,
      authorId: pastor.id,
      note: "Reached out privately to schedule a pastoral care meeting next week.",
    },
  });
  await prisma.prayerAssignment.create({
    data: { prayerRequestId: prayer3.id, assignedToId: pastor.id, assignedById: admin.id, status: "OPEN" },
  });

  const prayerAnswered = await prisma.prayerRequest.create({
    data: {
      authorId: extraMembers[2].id,
      title: "Financial breakthrough",
      details: "Prayed for provision during a tight month, and God provided beyond what we asked.",
      category: "FINANCES",
      urgency: "LOW",
      privacy: "PUBLIC",
      status: "ANSWERED",
      isPraiseReport: true,
    },
  });
  await prisma.prayerUpdate.create({
    data: {
      prayerRequestId: prayerAnswered.id,
      authorId: extraMembers[2].id,
      body: "Wanted to follow up and say — God came through! Thank you all for praying.",
    },
  });

  // ── Speakers & videos ────────────────────────────────────────────────
  // Seeded so an admin has someone to assign as speaker on synced sermons
  // (YouTube metadata has no speaker field) — not bound to a variable
  // since nothing else here references them.
  await prisma.speaker.create({
    data: { name: "Pastor Marcus Whitfield", title: "Lead Pastor", bio: "Preaching grace and truth at Living Word since 2009." },
  });
  await prisma.speaker.create({
    data: { name: "Elder Grace Amadi", title: "Elder & Bible Teacher", bio: "Teaching the Word with clarity and conviction." },
  });

  // Real sermon videos come from the church's YouTube channel via
  // syncYouTubeSermons() (src/lib/youtube.ts) — no placeholder video/series
  // content is seeded here anymore. Run the "Sync from YouTube" button in
  // Admin → Media (or the cron route) once YOUTUBE_API_KEY is configured.

  // ── Events ─────────────────────────────────────────────────────────
  const now = new Date();
  function daysFromNow(days: number, hour: number, minute = 0) {
    const d = new Date(now);
    d.setDate(d.getDate() + days);
    d.setHours(hour, minute, 0, 0);
    return d;
  }

  const eventDefs = [
    {
      title: "Sunday Morning Service",
      slug: "sunday-morning-service",
      description: "Join us for worship, the Word, and warm community.",
      start: daysFromNow(((7 - now.getDay()) % 7) || 7, 10),
      hours: 1.5,
      location: "Main Sanctuary",
      ministry: null,
    },
    {
      title: "Tuesday Morning Prayer",
      slug: "tuesday-morning-prayer",
      description: "Start your week interceding alongside the Prayer Team.",
      start: daysFromNow(((2 - now.getDay() + 7) % 7) || 7, 6, 30),
      hours: 1,
      location: "Prayer Room",
      ministry: "prayer-ministry",
    },
    {
      title: "Living Word Youth Night",
      slug: "living-word-youth-night",
      description: "Games, worship, and a message for middle & high schoolers.",
      start: daysFromNow(((5 - now.getDay() + 7) % 7) || 7, 18, 30),
      hours: 2,
      location: "Youth Hall",
      ministry: "youth-ministry",
    },
    {
      title: "New Members Class",
      slug: "new-members-class",
      description: "Learn about our beliefs, values, and how to get plugged in.",
      start: daysFromNow(10, 9),
      hours: 2,
      location: "Room 204",
      ministry: null,
    },
    {
      title: "Community Outreach Day",
      slug: "community-outreach-day",
      description: "Serving our neighbors through a neighborhood food drive.",
      start: daysFromNow(18, 9),
      hours: 4,
      location: "Church Parking Lot",
      ministry: "outreach-missions",
    },
  ];

  for (const e of eventDefs) {
    const end = new Date(e.start.getTime() + e.hours * 60 * 60 * 1000);
    const event = await prisma.event.create({
      data: {
        title: e.title,
        slug: e.slug,
        description: e.description,
        startAt: e.start,
        endAt: end,
        location: e.location,
        ministryId: e.ministry ? ministries.get(e.ministry)!.id : null,
        createdById: pastor.id,
        visibility: "PUBLIC",
        capacity: e.slug === "new-members-class" ? 25 : null,
      },
    });
    await prisma.eventRSVP.create({ data: { eventId: event.id, userId: member.id, status: "GOING" } });
    await prisma.eventRSVP.create({ data: { eventId: event.id, userId: extraMembers[0].id, status: "GOING" } });
    await prisma.eventRSVP.create({ data: { eventId: event.id, userId: extraMembers[1].id, status: "INTERESTED" } });
  }

  // ── Announcements ──────────────────────────────────────────────────
  await prisma.announcement.create({
    data: {
      title: "Join us this Sunday",
      body: "Join us this Sunday as we gather in faith, worship, and expectation. We can't wait to see you.",
      authorId: pastor.id,
      targetType: "EVERYONE",
      priority: "NORMAL",
      pinned: true,
    },
  });
  await prisma.announcement.create({
    data: {
      title: "Parking lot repaving this weekend",
      body: "Our main lot will be repaved Saturday. Please use the north overflow lot for Sunday service.",
      authorId: admin.id,
      targetType: "EVERYONE",
      priority: "IMPORTANT",
    },
  });

  // ── App settings ───────────────────────────────────────────────────
  await prisma.appSetting.create({
    data: {
      key: "branding",
      value: {
        churchName: "Living Word Community",
        tagline: "Grow in faith. Build community. Stay connected.",
        primaryColor: "#4a1220",
        accentColor: "#c39a4b",
        registrationMode: "APPROVAL_REQUIRED",
        contactEmail: "hello@livingwordcommunity.church",
      },
    },
  });

  // Keep denormalized member counts in sync with actual memberships.
  const allGroups = await prisma.group.findMany({ select: { id: true } });
  for (const g of allGroups) {
    const count = await prisma.groupMember.count({ where: { groupId: g.id, status: "ACTIVE" } });
    await prisma.group.update({ where: { id: g.id }, data: { memberCount: count } });
  }
  const allSpaces = await prisma.space.findMany({ select: { id: true } });
  for (const s of allSpaces) {
    const count = await prisma.spaceMember.count({ where: { spaceId: s.id, status: "ACTIVE" } });
    await prisma.space.update({ where: { id: s.id }, data: { memberCount: count } });
  }

  console.log("Seed complete.");
  console.log(`Sample accounts (all share the password below):`);
  console.log(`  Administrator   admin@livingword.church`);
  console.log(`  Pastor/Staff    pastor@livingword.church`);
  console.log(`  Ministry Leader worship.leader@livingword.church`);
  console.log(`  Group Leader    group.leader@livingword.church`);
  console.log(`  Member          member@livingword.church`);
  console.log(`  Pending member  ${pendingMember.email} (awaiting admin approval)`);
  console.log(`\nDev login password for every seeded user: ${DEV_PASSWORD}\n`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
