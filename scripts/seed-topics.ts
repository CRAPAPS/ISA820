/**
 * Run on server after deploy to seed knowledge_base topics.
 * Usage: npx tsx scripts/seed-topics.ts
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const topics = [
  {
    topic: 'knowledge-of-good-and-evil',
    title: 'The Knowledge of Good and Evil',
    content: `## When "Good" Doesn't Mean What You Think

The very first time the word "good" appears in Scripture, it is spoken by God over light itself.

*"And God said, Let there be light: and there was light. And God saw the light, that it was good: and God divided the light from the darkness."* — **Genesis 1:3-4**

We read "good" and quietly assume it means *nice*, *pleasant*, or *morally upright*. But the Hebrew tells a sharper story.

### TOV — Strong's H2896 (towb)

Strong's glosses *tov* as "pleasant, agreeable, good." Accurate enough on the surface — but it misses the weight the Hebrew carries. *Tov* describes something that **fulfills the very purpose for which it was created**. The truest single-word translation is not "good" but **FUNCTIONAL**.

Read Genesis 1:4 again with that lens:

*God saw the light, that it was **functional** — and God divided the light from the darkness.*

The light wasn't merely pleasing to look at. It *worked*. It did exactly what light was made to do.

**GOOD = FUNCTIONAL**

### The Seed Inside the Seed

The full depth of *tov* surfaces a few verses later, in the creation of growing things.

*"...the fruit tree yielding fruit after his kind, whose seed is in itself, upon the earth... and God saw that it was good."* — **Genesis 1:11-12**

Notice the detail God draws our eye to: the seed is already *inside* the fruit. Every plant is created not as a dead end but as an engine of life — carrying within itself everything required to produce the next generation, which in turn carries the same life forward again. That is *tov* in its fullest sense: not just "good," but **life-giving and self-perpetuating.** It brings, sustains, and promotes life.

---

## And Then, Its Shadow: RA

### RA — Strong's H7451 (ra)

Strong's lists *ra* as "evil, adversity, affliction, calamity, distress." Again, true on the surface — but the Hebrew intent is more precise. *Ra* means **DYSFUNCTIONAL**: impaired or abnormal action; a thing operating *other than* the purpose for which it was made. If *tov* is something doing exactly what it was created to do, *ra* is that same thing failing to.

### Where "Evil" First Appears

The word "evil" does not appear once across the six days of creation. Its first mention comes only in the garden:

*"...the tree of life also in the midst of the garden, and the tree of knowledge of good and evil."* — **Genesis 2:8-9**

And here is the detail most readers rush past: **God Himself plants this tree and causes it to grow out of the ground.** The knowledge of good and evil is something the Creator deliberately brings into the garden.

How can that be, if God is good? Because the moment something *good* exists, its exact opposite becomes *conceivable*. Create "up," and "down" is suddenly thinkable. Create function, and dysfunction exists — at least as a concept — as its natural shadow. The tree holds the *knowledge* of that opposite. It does not hold evil itself.

**EVIL = NON-FUNCTIONAL**

---

## "God" Is a Title, Not a Name

To follow the argument, one more thing must be cleared up. The English word "God" translates the Hebrew **Elohim** — meaning *mighty one* or *mighty ones*. It is a **title**, not a personal name, and Scripture applies it to angels, servants, judges, kings, prophets, and even mighty men of war.

The Most High's actual name is given plainly:

*"...by the name of God Almighty (Eil Shaddai), but by my name YHVH was I not known to them."* — **Exodus 6:3**

*"...this is my name for ever, and this is my memorial unto all generations."* — **Exodus 3:15**

### To Know Good and Evil Is to Be Like the Mighty Ones

The knowledge of good and evil is a **defining characteristic of an Elohim** — a direct fruit of spiritual understanding and wisdom.

*"Behold, the man is become as one of us, to know good and evil..."* — **Genesis 3:22**

This is why, in Psalm 82, the children of Israel themselves are addressed as *gods*:

*"...I have said, Ye are gods; and all of you are children of the Most High. But ye shall die like men, and fall like one of the princes."* — **Psalm 82:6-7**

The Father holds full knowledge of both good and evil — yet **He chooses good and does no evil.** He is the God of the living (*function*), not the God of the dead (*non-function*).

*"Have I any pleasure at all that the wicked should die? saith the Lord GOD: and not that he should return from his ways, and live?"* — **Ezekiel 18:23**

---

## So — Did the Father Create Evil?

**A hard no.**

Across all six days of creation, the text never once names "evil." On the seventh day God *rested*, because the work was **finished**:

*"And God saw every thing that he had made, and, behold, it was very good."* — **Genesis 1:31**

*"...he rested on the seventh day from all his work which he had made."* — **Genesis 2:1-3**

If creation was completed and pronounced *very good*, and if Scripture tells us plainly that *"there is no new thing under the sun"* (**Ecclesiastes 1:9**), then evil cannot have been part of what God made. It was not created by the Creator — it was **introduced later, by one of those whom He created.**

### The Genesis of Evil

Evil has an origin story, but it begins not in God's hand — in a created heart:

*"Thou wast perfect in thy ways from the day that thou wast created, till iniquity was found in thee."* — **Ezekiel 28:15**

Iniquity was first found in the mind of an anointed, covering cherub — born of pride and lust. He then carried it to mankind, enticing them with subtle, honeyed words to transgress God's law and *act* on evil for themselves.

Here is a striking nuance: **this cherub is never recorded as having eaten from the tree.** As a created mighty one, he already possessed the knowledge of good and evil from the day he was made — because that knowledge is simply a characteristic of the mighty ones. The tree offered that same knowledge to mankind. It did not invent evil; it transferred awareness.

---

## Knowledge Is Not Action

This is the hinge of the whole teaching: **there is a world of difference between knowing a thing and doing it.**

Consider a simple parallel. When the Wright brothers flew the first powered airplane in 1903, they did not *invent* the danger of falling — but the very instant flight became possible, the parachute became *conceivable*. The parachute is the airplane's exact functional opposite: one ascends and travels the skies, the other descends safely to the ground. It arose as a concept the moment its counterpart existed. Yet conceiving of the parachute is not the same as ever needing to jump.

So it is with good and evil. The knowledge of evil exists as the conceptual shadow of good — but **we are judged by our works, not by what we merely know:**

*"...they are wise to do evil, but to do good they have no knowledge."* — **Jeremiah 4:22**

*"...your eyes shall be opened, and ye shall be as gods, knowing good and evil."* — **Genesis 3:5**

---

## Conclusion — The Weight of the Choice

Within the Genesis narrative lies a profound truth: **evil does not inherently exist within creation.** It emerges later, out of the hearts and minds of beings with moral agency — and out of the choices they make. God gave humanity the gift of free will, and with it the capacity for both good and evil. By rebelling against His perfect will — the very standard and measure of what is *functional* — humanity introduced evil *in action* into the world.

The absence of evil in the original creation is a quiet, powerful reminder of God's intention: a world of harmony and order, governed and maintained by His Royal Law. Evil is not a product of His creative act — it is a *departure* from His design, born of wandering eyes, pride, lust, and the misuse of freedom.

And so the responsibility rests on us. As beings made in the image of God, we carry not only the *capacity* to discern good from evil, but — because of and like Him — the *wisdom to choose* function over dysfunction, life over death. To choose good is to align with the purpose for which we were made. To choose evil is to fall into discord and decay.

This is the calling of the mighty sons and daughters of the Most High: to choose righteousness, and in doing so to take part in the Father's plan — the restoration of all creation back to its original, *Edenic* state of goodness and wholeness.`,
    supporting_verses: [
      'Genesis 1:3', 'Genesis 1:4', 'Genesis 1:11', 'Genesis 1:12',
      'Genesis 1:31', 'Genesis 2:1', 'Genesis 2:8', 'Genesis 2:9',
      'Genesis 3:5', 'Genesis 3:22', 'Exodus 3:15', 'Exodus 6:3',
      'Psalms 82:6', 'Psalm 34:21', 'Ezekiel 18:23', 'Ezekiel 28:15',
      'Ecclesiastes 1:9', 'Jeremiah 4:22',
    ],
    confidence_level: 'HIGH',
    related_topics: [
      'tov', 'ra', 'elohim', 'creation', 'genesis',
      'free-will', 'lucifer', 'yhvh', 'tree-of-knowledge', 'tree-of-life',
      'good', 'evil', 'functional', 'sabbath', 'royal-law',
    ],
  },

  {
    topic: 'matthew-1-16-biological-paternity',
    title: 'The Biological Paternity of the Messiah (Matthew 1:16)',
    content: `## The Pronoun That Launched a Doctrine

Few single words in the New Testament carry as much theological weight as one small Greek pronoun in **Matthew 1:16**. Trinitarian translators seize on the feminine *hēs* — "of whom" — to argue that the Messiah came from Mary *alone*, and that Joseph was not his biological father. From that one grammatical thread hangs the entire doctrine of a divine, half-human Messiah.

But when this reading is laid against the requirements of the Torah and the physics of prophecy, it does not hold. It opens a series of legal and biological *fault lines* — and every one of them runs against Scripture's own demands.

This study makes the forensic case that the Messiah's "begotten" status is **a title of victory over death — not a biological replacement of his human father, Joseph.**

---

## 1. The Forensic Key — John 1:13

The whole misunderstanding unlocks here.

*"...which were born, not of blood, nor of the will of the flesh, nor of the will of man, but of God."* — **John 1:13**

Notice what "born of God" actually means in Scripture's own definition: a matter of **Will and Plan**, not biological insemination. Every believer described in this verse has a flesh-and-blood father — yet each is said to be "born of God" by His Spirit and His purpose.

The Messiah is the same pattern, perfected. He was born *of Joseph* (the biological seed) and *of God* (the Spirit's Plan). The "Holy Spirit" is not a third person siring a child; it is **the Father in action** — the very same Power that moved over the waters in Genesis, now moving to execute His plan through Joseph and Mary.

---

## 2. The Firstborn From the Dead — Colossians 1:18

Here is the hinge the Greek reading misses entirely: the word "begotten" is forensically tied to the **resurrection**, not the womb.

*"...who is the beginning, the firstborn from the dead; that in all things he might have the preeminence."* — **Colossians 1:18**

The title is *Prototokos* — the **Firstborn from the Dead.** He is the first of a new kind of perfected human life, the prototype of resurrection.

*"...that he might be the firstborn among many brethren."* — **Romans 8:29**

And this is exactly where the "God-man" theory collapses. If the Messiah were a divine hybrid, conceived from a spirit-seed in the womb, he could not be the *"firstborn among many brothers"* — because his brothers do not share that hybrid origin. He is our brother precisely *because* he shares our biological origin, father and mother alike. He is our leader precisely because he is the first to be "begotten" out of death and into eternal life.

---

## 3. Why the "Spirit-Seed" Theory Fails

The claim that the Spirit supplied a biological start runs straight into the technical requirements of the Davidic Covenant — and fails three tests.

### No seed in a spirit

Scripture defines a spirit as having no flesh, no bones, and therefore no biological seed (*zera*). A spirit cannot supply what it does not possess.

### The body of David

*"...I will set up thy seed after thee, which shall proceed out of thy bowels..."* — **2 Samuel 7:12**

*"...Of the fruit of thy body will I set upon thy throne."* — **Psalm 132:11**

The covenant demands a Messiah who is the biological seed of David's *physical body*. A spirit-conceived child satisfies neither "bowels" nor "fruit of thy body."

### The "like Moses" requirement

*"I will raise them up a Prophet from among their brethren, like unto thee..."* — **Deuteronomy 18:18**

The promised prophet must be *like Moses* — and Moses had a human father and mother. Remove the Messiah's human father, and he fails both the likeness test and the "from among your brothers" requirement.

---

## 4. The Singular Plan, Executed

Line up the scattered scriptures and the "mirage" resolves into one coherent picture — and it is utterly singular:

- **The Father, Yahweh** — the only God *(Isaiah 45:22)*, the Spirit who is Holy, who moved by His own power to carry out the Plan (the *Logos*) established in His mind.
- **The father, Joseph** — the biological source of the Davidic seed, fulfilling both the Law and the "Prophet like Moses" requirement.
- **The result** — a fully human King, born according to the ordinary laws of procreation, who was then "begotten" as the Firstborn from the Dead to lead his brothers into the new creation.

---

## Final Summary

The feminine pronoun in Matthew 1:16 tells us who *carried* the Plan — Mary — but it cannot legally erase the biological father the Torah requires. The Messiah is the biological son of Joseph, and that is exactly what makes him the **Son of David**. He is the Unique Son — *Monogenes* — because he was the singular fulfillment of the Father's Spirit-driven Plan. And he is the **Firstborn from the Dead**, proving that the one God of Isaiah 45:22 can save the very ends of the earth through a human brother who conquered death.`,
    supporting_verses: [
      'Matthew 1:16', 'John 1:13', 'Colossians 1:18', 'Romans 8:29',
      '2 Samuel 7:12', 'Psalm 132:11', 'Deuteronomy 18:18', 'Isaiah 45:22',
    ],
    confidence_level: 'HIGH',
    related_topics: [
      'messiah', 'son-of-david', 'firstborn', 'resurrection', 'holy-spirit',
      'joseph', 'virgin-birth', 'unitarian', 'monogenes', 'davidic-covenant',
      'trinity', 'logos',
    ],
  },

  {
    topic: 'matthew-1-20-conception',
    title: 'Matthew 1:20 and the Nature of the Conception',
    content: `## "Take Her" — The Verse That Hides a Marriage

Matthew 1:20 is one of the most quoted verses in defense of a miraculous, biology-bypassing "Incarnation." The standard reading paints it like this: the Holy Spirit, a divine third person, had already supernaturally *completed* the conception — and Joseph was told to "take" Mary only as a guardian, a legal cover for a child that was not his.

But the Greek does not say that. Read carefully, Matthew 1:20 describes something far more ordinary, and far more faithful to the Law: a divinely-initiated conception *inside a real marriage*, with Joseph commanded to step fully into his role as husband.

---

## The Conception — *gennēthen*

*"...for that which is conceived in her is of the Holy Ghost."* — **Matthew 1:20**

The key word is *gennēthen* — from *gennaō* (Strong's G1080), meaning to *beget*, *bring forth*, or *conceive*. Two technical details get smoothed over in English:

- It is an **Aorist Passive Participle.** The Aorist states the *fact* of an occurrence without locking it to a fixed point in time relative to the speaker. It announces *that* the begetting is real — not that it was a finished, sealed-off supernatural event independent of the marriage.
- "Of the Holy Spirit" is *ek pneumatos hagiou* — "out of / from holy spirit." *Pneuma* is a **neuter** noun: a power, a breath, an influence — not a "he," not a separate deity. The little word *ek* ("out of") marks the **source of the empowerment**, not a begetting by a second God. The Holy Spirit here is the Father's own power in action.

---

## The Command — *paralabein*

*"...fear not to take unto thee Mary thy wife..."* — **Matthew 1:20**

The verb is *paralambanō* (Strong's G3880) — to *take to oneself*, *receive*, *accept into one's home*. And the lexicons are explicit: in the full LSJ, *paralambanein gunaika* is a standard idiom for **"taking a wife"** into one's house to begin married life together.

The angel does not call her "the virgin" or "the vessel." He calls her *tēn gunaika sou* — **"your wife."** That phrase carries weight: under Judean law, betrothal was already legally marriage. Joseph is not being asked to babysit a finished miracle — he is being told to stop being afraid and to **finalize the marriage**: to bring her home and assume the full role of a husband.

---

## Why the Trinitarian Reading Breaks

### It violates the Shema

If the "Holy Spirit" is a separate person who conceived the child, then the Spirit is — by definition — that child's father. But Scripture already names the Father as the Father. You are left with the absurdity of two Fathers, which shatters the strict oneness of the Shema: *"Hear, O Israel: The LORD our God is one LORD."*

### The temporal tension dissolves

Critics sense a tension: the conception sounds "past," yet Joseph is instructed about the future. But that tension only exists if you force the conception to be a completed, marriage-independent act. The Aorist *gennēthen* points instead to a **process initiated by God's power** — leaving Joseph's role as husband meaningful, not redundant.

### The "taking" has a purpose

If consummation were forbidden or pointless, why would the angel stress that Mary is *"your wife"*? The command to **take** is a command to be a husband in full — legally and physically — thereby securing the child's place in the **House of David** through Joseph's paternity.

---

## Synthesis

Matthew 1:20 is not the charter of a Trinitarian incarnation. It is the record of a divine intervention *within* the natural order: the *pneuma* — the holy power of the Father — initiating a conception inside a lawful marriage, and an angel commanding Joseph to *paralambanō*, to take his wife and fulfill the Davidic line.

The Aorist states the divine *fact* of the conception's origin. It never lifts the event out of the home Joseph and Mary were building together. The "Holy Spirit" is the **agency of God, not a second actor** — for God is not the author of confusion, but the faithful fulfiller of the Law and the Prophets through the lineage of David.`,
    supporting_verses: [
      'Matthew 1:20', 'Deuteronomy 6:4', '1 Corinthians 14:33', '2 Samuel 7:12',
    ],
    confidence_level: 'HIGH',
    related_topics: [
      'messiah', 'virgin-birth', 'holy-spirit', 'conception', 'son-of-david',
      'shema', 'trinity', 'paralambano', 'gennao', 'joseph', 'unitarian',
      'davidic-covenant',
    ],
  },

  // ---------------------------------------------------------------------------
  // Migrated from supabase/migrations/001_initial_schema.sql (were sample stubs).
  // Kept verbatim so they are version-controlled here. Each is a placeholder
  // awaiting a source document to be expanded into a full flowing study, the
  // same way 'knowledge-of-good-and-evil' was rewritten from its PDF.
  // ---------------------------------------------------------------------------
  {
    topic: 'soul',
    title: 'The Nature of Soul (Nephesh)',
    content: `A soul (nephesh) is not an immortal spirit trapped in a body. Scripture reveals that a soul IS a living being - the combination of body (basar) and breath (neshamah). When breath returns to Elohim, the soul ceases to exist.`,
    supporting_verses: ['Genesis 2:7', 'Ezekiel 18:4', 'Matthew 10:28'],
    confidence_level: 'HIGH',
    related_topics: ['spirit', 'breath', 'nephesh', 'immortality'],
  },
  {
    topic: 'trinity',
    title: 'The Trinity Doctrine vs Scripture',
    content: `The Trinity is a post-biblical invention (councils of Nicea 325 AD, Constantinople 381 AD). The Father is never called "God the Son." YAHUSHUA prayed to the Father, called His Father "my God," and stated the Father is "greater than all."`,
    supporting_verses: ['John 20:17', '1 Corinthians 11:3', 'John 14:28'],
    confidence_level: 'HIGH',
    related_topics: ['godhead', 'oneness', 'deity of Christ', 'holy spirit'],
  },
  {
    topic: 'alpha-omega',
    title: 'Alpha and Omega - Father Only',
    content: `The Father declares "I am the Alpha and Omega" in Revelation 1:8. In 21:6, He says "I am the Alpha and Omega." The Son calls himself the "First and Last" (Rev 1:17, 2:8, 22:13) - a DIFFERENT title. Confusion of these titles leads to the false doctrine that the Son is the Father.`,
    supporting_verses: ['Revelation 1:8', 'Revelation 21:6', 'Revelation 1:17', 'Revelation 2:8'],
    confidence_level: 'HIGH',
    related_topics: ['father', 'son', 'names of God', 'revelation'],
  },
  {
    topic: 'oneness',
    title: 'Yahweh is One - Absolute Unity',
    content: `Deuteronomy 6:4 is the Shema - the foundational confession of Israel. "Yahweh is one" (echad) means absolute unity, not a complex trinitarian math problem. There is ONE Being called Yahweh.`,
    supporting_verses: ['Deuteronomy 6:4', 'Isaiah 43:10', 'Isaiah 44:6'],
    confidence_level: 'HIGH',
    related_topics: ['godhead', 'unity', 'yhwh', 'monotheism'],
  },
];

async function seed() {
  for (const t of topics) {
    const { error } = await supabase
      .from('knowledge_base')
      .upsert(t, { onConflict: 'topic' });
    if (error) {
      console.error(`Failed "${t.topic}":`, error.message);
    } else {
      console.log(`Seeded: ${t.topic}`);
    }
  }
  console.log('Done.');
}

seed().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
