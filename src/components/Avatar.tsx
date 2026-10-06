const GRADIENTS = [
  ['#5b8cff', '#8b5cf6'],
  ['#22c1c3', '#3b82f6'],
  ['#f97316', '#ec4899'],
  ['#10b981', '#06b6d4'],
  ['#a855f7', '#6366f1'],
  ['#f43f5e', '#f59e0b'],
];

function initials(name: string): string {
  const words = name.replace(/[^\p{L}\p{N}\s]/gu, '').trim().split(/\s+/);
  const letters = words.slice(0, 2).map((w) => w[0] ?? '');
  return letters.join('').toUpperCase() || '#';
}

export function Avatar({ name, seed, size = 48 }: { name: string; seed: string; size?: number }) {
  const hash = [...seed].reduce((acc, ch) => (acc * 31 + ch.charCodeAt(0)) >>> 0, 7);
  const [from, to] = GRADIENTS[hash % GRADIENTS.length];
  return (
    <div
      className="avatar"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.38,
        background: `linear-gradient(135deg, ${from}, ${to})`,
      }}
      aria-hidden="true"
    >
      {initials(name)}
    </div>
  );
}
