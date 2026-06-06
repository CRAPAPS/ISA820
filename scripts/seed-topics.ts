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
    content: `## GOOD = TOV (H2896 — towb)

Strongs describes "tov" as meaning pleasant, agreeable, good — however this is not an accurate translation. According to Hebrew sources, Tov is from the Hebrew word for "good" but with a fuller intent which implies something which **fulfills the purpose for which it was created**. In other words, the word TOV is best translated as meaning "FUNCTIONAL".

Genesis 1:4 — "God saw the light, that it was FUNCTIONAL: and God divided the light from the darkness."

### Tov = Promotes Life

Genesis 1:11-12 shows the fullest depth of meaning: plants created with their seeds already contained within, fully capable of perpetuating the cycle of life. TOV means that which brings, perpetuates, or promotes life.

---

## EVIL = RA (H7451 — ra)

Strongs describes "RA" as Evil, adversity, affliction, bad, calamity, displeasure, distress — however again this is not an accurate translation. According to Hebrew sources, RA is from the Hebrew word for "bad" but with a deeper intent meaning: **Dysfunctional** — impaired or abnormal action other than that for which a person or thing is intended. Something that does not function within its intended purpose.

The first mention of "Evil" occurs in Genesis 2:8-9 — "The tree of knowledge of good and evil." It is important to note here that God creates this tree and caused it to grow out of the ground. The existence of Evil in concept (but not in action) is a natural consequence of the creation of what is good.

**EVIL = NON-FUNCTIONAL**

---

## Did the Father Create Evil?

**The answer is NO.** During the entire creation saga of Genesis 1 (the six days), the text is void of any mention of the word "Evil." Genesis 1:31 — "God saw every thing that he had made, and behold, it was very good."

Ecclesiastes 1:9 — "There is no new thing under the sun." We can accurately conclude that Evil was not created by the creator, but instead was **introduced later by one of those who were created**.

### The Genesis of Evil

Iniquity was first found in the heart and mind of Lucifer, a covering cherub who was created as a mighty one (Ezekiel 28:15). He then by his subtle honeyed words enticed man to transgress the law of God. There is a clear difference between the knowledge of something and the action of that thing.

---

## The Knowledge of Good and Evil — An Elohim Characteristic

The knowledge of good and evil is a **characteristic of a mighty one (Elohim)** and is a direct consequence of spiritual understanding and wisdom. Genesis 3:22 — "Behold, the man is become as one of us, to know good and evil."

Psalms 82 confirms that the children of Israel are referred to as "gods" (elohim): "I have said, Ye are gods; and all of you are children of the Most High." The Father, YHVH, understands both good and evil yet chooses good and does no evil — He is the God of the living (FUNCTION) and not the God of the dead (NON-FUNCTION).

---

## Conclusion

Within the Genesis narrative lies a profound theological truth: evil does not inherently exist within creation but emerges later out of the hearts and minds of beings with moral agency. God, the Creator, bestowed upon humanity the gift of free will, granting us the capacity to do good and evil. Through the exercise of this free will, humanity introduced the concept of evil in action into the world by disobeying and rebelling against God's perfect will, which is the standard and measure of what is Good or Functional.

As beings created in the image of God, we possess not only the capacity to understand and discern between good and evil, but — because of and like God — the wisdom to choose between function or life over non-function or death. Our responsibility as mighty sons and daughters of the Most High is to choose righteousness, thereby participating in the Father's plan for the restoration of His creation back to its original intended state of goodness and wholeness.`,
    supporting_verses: [
      'Genesis 1:3', 'Genesis 1:4', 'Genesis 1:11', 'Genesis 1:12',
      'Genesis 1:31', 'Genesis 2:8', 'Genesis 2:9', 'Genesis 3:5',
      'Genesis 3:22', 'Exodus 3:15', 'Exodus 6:3', 'Psalms 82:1',
      'Psalm 34:21', 'Ezekiel 18:23', 'Ezekiel 28:15',
      'Ecclesiastes 1:9', 'Jeremiah 4:22',
    ],
    confidence_level: 'HIGH',
    related_topics: [
      'tov', 'ra', 'elohim', 'creation', 'genesis',
      'free-will', 'lucifer', 'yhvh', 'tree-of-knowledge',
      'good', 'evil', 'functional',
    ],
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
