const cats = [
	`
  /\\_/\\
 ( o.o )
  > ^ <
`,
	`
  /\\_/\\
 ( -.- )
  > ^ <
`,
	`
  /\\_/\\
 ( ^.^ )
  > ^ <
`,
	`
  /\\_/\\
 ( =^･ω･^= )
  > ^ <
`,
	`
  /\\_/\\
 ( =^･^= )
  > ^ <
`
];

export function getRandomCat(): string {
	return cats[Math.floor(Math.random() * cats.length)];
} 