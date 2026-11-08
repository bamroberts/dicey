const roll: rollI = [6, 6, 4, 3, 2];
const roll2 = () =>  Array.from({length: 5}, () => Math.ceil(Math.random() * 6));

const sum = (die: number[]) => die.reduce((a, b) => a + b, 0);
const tops = (top = 6, die = [6, 5, 6, 3, 2, 1]) => sum(die.filter((a) => a === top));

const groupDie = (die: number[]) =>
  die.reduce((b, value) => {
    if (!b[value]) {
      b[value] = 0;
    }
    b[value] += 1;
    return b;
  }, {} as { [key: number]: number });

const ofAKind = (min: number, die: number[] = [6, 6, 6, 3, 2, 1]) => {
  if (Object.values(groupDie(die)).filter((a) => a >= min).length) {
    return sum(die);
  }
  return 0;
};

const fullHouse = (die = [6, 6, 6, 3, 2, 1]) => {
  const group = Object.values(groupDie(die));
  if (!group.find((length) => length === 3)) {
    return 0;
  }
  if (!group.find((length) => length === 2)) {
    return 0;
  }
  return 25;
};

const straight = (die = [1, 4, 2, 6, 3, 1]) => {
  const sorted = die.sort((a, b) => a - b);
  let length = 0;
  let maxLength = 0;
  let lastValue: null | number = null;
  sorted.forEach((v) => {
    if (v === lastValue) {
      // Skip same values
      return;
    } 
    if (lastValue && lastValue + 1 !== v) {
      // Reset if sequence broken
      length = 0;
    }
    lastValue = v;
    length += 1;
    maxLength = Math.max(maxLength, length);
  });
  return maxLength;
};

// Output
type rollI = [number, number, number, number, number];
type scoreI = { [key: string]: (d: rollI) => number };

export const testScore: scoreI = {
  Ones: (d) => tops(1, d),
  Twos: (d) => tops(2, d),
  Threes: (d) => tops(3, d),
  Fours: (d) => tops(4, d),
  Fives: (d) => tops(5, d),
  Sixes: (d) => tops(6, d),
  'Three of a kind': (d) => ofAKind(3, d),
  'Four of a kind': (d) => ofAKind(4, d),
  'Full House': (d) => fullHouse(d),
  'Small Straight': (d) => (straight(d) >= 4 ? 30 : 0),
  'Large Straight': (d) => (straight(d) >= 5 ? 40 : 0),
  Yahtzee: (d) => (ofAKind(5, d) ? 50 : 0),
  Chance: (d) => sum(d),
}

for (const [key, value] of Object.entries(testScore)) {
  console.log(`${key}: ${value(roll)}`);
}
