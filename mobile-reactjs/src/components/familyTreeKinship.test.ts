import { getGrandGenerationIds, FamilyTreeLink } from './familyTreeKinship';

describe('getGrandGenerationIds', () => {
  it('marks only parents of the focused member’s parents as grandparents', () => {
    const links: FamilyTreeLink[] = [
      { fromUserId: 'anand', toUserId: 'priya', type: 'mother' },
      { fromUserId: 'priya', toUserId: 'rahul', type: 'father' },
      { fromUserId: 'rahul', toUserId: 'anjali', type: 'spouse' },
      { fromUserId: 'anjali', toUserId: 'rahul', type: 'spouse' },
      { fromUserId: 'priya', toUserId: 'devika', type: 'sister' },
    ];

    const result = getGrandGenerationIds('anand', links);

    expect(Array.from(result.grandparents)).toEqual(['rahul']);
    expect(result.grandparents.has('anjali')).toBe(false);
    expect(result.grandparents.has('devika')).toBe(false);
  });

  it('marks only children of the focused member’s children as grandchildren', () => {
    const links: FamilyTreeLink[] = [
      { fromUserId: 'hari', toUserId: 'anand', type: 'son' },
      { fromUserId: 'anand', toUserId: 'nila', type: 'daughter' },
      { fromUserId: 'nila', toUserId: 'sanjay', type: 'spouse' },
    ];

    const result = getGrandGenerationIds('hari', links);

    expect(Array.from(result.grandchildren)).toEqual(['nila']);
    expect(result.grandchildren.has('sanjay')).toBe(false);
  });
});
