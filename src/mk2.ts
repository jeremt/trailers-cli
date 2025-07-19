import { JSDOM } from "jsdom";
import { type } from "arktype";

export type Theater = { name: string; slug: string };

export async function getTheaters(): Promise<Theater[]> {
  const res = await fetch("https://www.mk2.com/salles");
  const html = await res.text();
  const dom = new JSDOM(html);
  const doc = dom.window.document;

  const theaters: Theater[] = [];
  for (const h2 of doc.querySelectorAll("h2")) {
    // get the h2's parent <a> for the slug
    let node: HTMLElement | null = h2;
    while (node !== null && node.tagName !== "A") {
      node = node.parentElement;
    }
    if (node === null) {
      throw new Error(`Could not get link for ${h2.textContent}`);
    }
    theaters.push({
      name: h2.textContent ?? "",
      slug: node.getAttribute("href") ?? "",
    });
  }
  return theaters;
}

export async function getTodaySessions(slug: `/salle/${string}`) {
  const res = await fetch(`https://www.mk2.com${slug}`);
  const html = await res.text();
  const dom = new JSDOM(html);
  const doc = dom.window.document;
  console.log(doc.title);
  for (const el of doc.querySelectorAll("a")) {
    console.log(el.getAttribute("href"));
  }
}

const partialApiResult = type({});
async function test() {
  const res = await fetch(
    "https://prod-paris.api.mk2.com/cinema-complex/mk2-bibliotheque"
  );
  const data = await res.json();

  traverse(data, (tree, key) => {
    if (key === "sessions") {
      const sessions = tree as any[];
      console.log(sessions.map((session) => session.showTime));
      console.log(sessions as any);
    }
  });
}

function traverse(
  tree: unknown,
  callback: (value: unknown, key: string) => void,
  key: string = "root"
) {
  // Skip null, undefined, and primitive types
  if (tree === null || tree === undefined || typeof tree !== "object") {
    callback(tree, key);
    return;
  }

  // Handle arrays - only recurse if array contains objects
  if (Array.isArray(tree)) {
    // Check if array contains any objects
    const hasObjects = tree.some(
      (item) => item !== null && item !== undefined && typeof item === "object"
    );

    if (hasObjects) {
      tree.forEach((item, index) => {
        traverse(item, callback, `${key}[${index}]`);
      });
    }
    callback(tree, key);
    return;
  }

  // Handle objects - call callback and then recurse into properties
  const obj = tree as Record<string, unknown>;
  callback(obj, key);

  // Recursively traverse object properties
  for (const [propKey, value] of Object.entries(obj)) {
    traverse(value, callback, propKey);
  }
}

(async () => {
  // console.log(await getTodaySessions("/salle/mk2-bibliotheque"));
  console.log(await test());
})();
