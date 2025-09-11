import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const glossaryDir = path.resolve("terms");
const resourcesDir = path.resolve("resources");
const outputFile = path.join(resourcesDir, "glossary.mdx");

type GlossaryEntry = {
    slug: string;
    title: string;
    description: string;
};

const files = fs.readdirSync(glossaryDir)
    .filter(file => file.endsWith(".mdx") && file !== "glossary.mdx");

const entries: GlossaryEntry[] = [];

for (const file of files) {
    const filePath = path.join(glossaryDir, file);
    const content = fs.readFileSync(filePath, "utf-8");
    const { data } = matter(content);

    if (!data.title || !data.description) {
        console.warn(`Skipping ${file} — missing title or description`);
        continue;
    }

    entries.push({
        slug: file.replace(/\.mdx$/, ""),
        title: data.title,
        description: data.description,
    });
}

// Group entries by first letter of title
const grouped = entries.reduce<Record<string, GlossaryEntry[]>>((acc, entry) => {
    const letter = entry.title[0].toUpperCase();
    if (!acc[letter]) acc[letter] = [];
    acc[letter].push(entry);
    return acc;
}, {});

// Sort A–Z
const sortedLetters = Object.keys(grouped).sort();

let output = `---
title: Glossary of Terms
---

<Panel>

### Glossary Navigation

${sortedLetters.map(letter => `- [${letter}](##${letter.toLowerCase()})`).join("\n")}

</Panel>

<Note>
Please note: The terms and definitions listed in this Glossary are subject to change without notice.
</Note>
`;

for (const letter of sortedLetters) {
    output += `\n\n---\n\n## ${letter}\n`;

    const terms = grouped[letter].sort((a, b) => a.title.localeCompare(b.title));

    for (const term of terms) {
        output += `\n#### [${term.title}](/terms/${term.slug})\n`;
        output += `${term.description}\n\n`;
        output += `[More →](/terms/${term.slug})\n`;
    }
}

fs.writeFileSync(outputFile, output);
console.log(`glossary.mdx generated with ${entries.length} entries`);