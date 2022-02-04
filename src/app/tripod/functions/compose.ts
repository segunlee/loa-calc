import {
  ComposeFilter,
  ComposeResult,
  Product,
  SearchResult,
  Summary,
  TripodText,
  TripodValue,
} from './type';
import { hashTripod, tripodComparer } from './util';

function getPrice(products: Product[]) {
  const trade2 = products.find((x) => x.tradeLeft === 2)?.buyPrice;
  const trade1 = products.find((x) => x.tradeLeft === 1)?.buyPrice;
  const trade0 = products.find((x) => x.tradeLeft === 0)?.buyPrice;

  if (!trade2 && !trade1 && !trade0) {
    return;
  }

  return {
    trade2,
    trade1,
    trade0,
    price: Math.min(
      ...[trade2, trade1, trade0].filter((x): x is number => x != null)
    ),
  };
}

function categorizeProducts(products: Product[]) {
  const head = products.filter((x) => x.name.endsWith('모자'));
  const top = products.filter((x) => x.name.endsWith('상의'));
  const bottom = products.filter((x) => x.name.endsWith('하의'));
  const glove = products.filter((x) => x.name.endsWith('장갑'));
  const shoulder = products.filter((x) => x.name.endsWith('견갑'));
  const weapon = products.filter(
    (x) =>
      ![...head, ...top, ...bottom, ...glove, ...shoulder].find(
        (y) => x.id === y.id
      )
  );
  return {
    180000: weapon,
    190010: head,
    190020: top,
    190030: bottom,
    190040: glove,
    190050: shoulder,
  };
}

function generateSummary(
  products: Product[],
  tripods: TripodText[]
): Summary | undefined {
  const tripodProducts = products.filter((product) =>
    tripods.every((tripod) =>
      product.effects.find(
        (effect) =>
          effect.skill === tripod.skill &&
          effect.tripod === tripod.tripod &&
          effect.level === tripod.level
      )
    )
  );

  const priceObj = getPrice(tripodProducts);
  if (!priceObj) {
    return;
  }
  return {
    tripod: tripods,
    ...priceObj,
  };
}

function tripodOverlap(
  summaryMap: Record<number, Summary>,
  tripods: TripodText[]
) {
  return !!Object.values(summaryMap).find((x) =>
    x.tripod.find((y) =>
      tripods.find((z) => z.skill === y.skill && z.tripod === y.tripod)
    )
  );
}

export function compose(
  products: Product[],
  tripods: TripodText[],
  categoryList: number[],
  filter: ComposeFilter
): ComposeResult[] {
  products.sort((a, b) => a.buyPrice - b.buyPrice);
  const filteredTripods = tripods.filter(
    (tripod) => !tripodOverlap(filter.fixedItems, [tripod])
  );
  const filteredCategoryList = categoryList.filter(
    (category) => !filter.fixedItems[category]
  );
  const tripodThreshold = Math.min(
    filteredTripods.length,
    filteredCategoryList.length * 2
  );
  const summaryRecord =
    tripodThreshold === filteredCategoryList.length * 2
      ? summarySearchResult(
          products.filter((x) => x.tripod.length >= 2),
          filter
        )
      : summarySearchResult(products, filter);
  const requiredTripodSet = new Set(
    filter.requiredTripods.map((tripod) => hashTripod(tripod))
  );

  let results: { combination: Record<number, Summary>; price: number }[] = [];
  function rec(
    combination: Record<number, Summary>,
    totalPrice: number,
    requiredLeft: number,
    categoryCount: number,
    tripodCount: number
  ) {
    if (totalPrice > (results[results.length - 1]?.price ?? Infinity)) {
      return;
    }
    if (requiredLeft > (filteredCategoryList.length - categoryCount) * 2) {
      return;
    }
    if (categoryCount === filteredCategoryList.length) {
      if (requiredLeft <= 0 && tripodCount >= tripodThreshold) {
        results.push({ combination, price: totalPrice });
        results.sort((a, b) => a.price - b.price);
        results = results.slice(0, 100);
      }
      return;
    }
    const category = filteredCategoryList[categoryCount];
    const list = summaryRecord[category];
    for (let el of list) {
      if (!tripodOverlap(combination, el.tripod)) {
        const requiredCount = el.tripod.filter((x) =>
          requiredTripodSet.has(hashTripod(x))
        ).length;
        rec(
          { ...combination, [category]: el },
          totalPrice + el.price,
          requiredLeft - requiredCount,
          categoryCount + 1,
          tripodCount + el.tripod.length
        );
      }
    }
  }
  rec(
    filter.fixedItems,
    Object.values(filter.fixedItems).reduce((sum, x) => sum + x.price, 0),
    requiredTripodSet.size,
    0,
    0
  );

  return results.map((result) => {
    const tripods = Object.values(result.combination).flatMap((x) => x.tripod);
    const restSingles = products
      .filter((x) => x.tripod.length === 1)
      .filter(
        (x) =>
          !tripods.find(
            (y) =>
              x.tripod[0].skill === y.skill && x.tripod[0].tripod === y.tripod
          )
      )
      .map((x) => ({
        tripod: x.tripod[0],
        price:
          x.products.filter((x) => x.buyPrice)[0]?.buyPrice ||
          x.products[0]?.auctionPrice ||
          0,
      }));
    return { ...result, restSingles };
  });
}
