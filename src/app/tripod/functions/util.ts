import { marketData } from '../data';
import { TripodText, TripodValue } from './type';

const valueMap = new Map(
  marketData.marketAuction.marketMenuAuctionSkillList.flatMap((skill) =>
    skill.marketMenuSkillTripodList.map((tripod) => [
      `${skill.value}-${tripod.value}`,
      [skill, tripod],
    ])
  )
);

const textMap = new Map(
  marketData.marketAuction.marketMenuAuctionSkillList.flatMap((skill) =>
    skill.marketMenuSkillTripodList.map((tripod) => [
      `${skill.value}-${tripod.value}`,
      [skill, tripod],
    ])
  )
);

export function getTripodString(item: TripodText) {
  return `[${item.skill}] ${item.tripod}+${item.level}`;
}

export function textToValue(item: TripodText): TripodValue {
  const [skill, tripod] = textMap.get(`${item.skill}-${item.tripod}`)!;
  return {
    skill: skill.value,
    tripod: tripod.value,
    level: item.level,
  };
}

export function hashTripod(tripod: TripodValue) {
  return `${tripod.skill}-${tripod.tripod}-${tripod.level}`;
}

export function tripodComparer(a: TripodText, b: TripodText) {
  const skillCompare = a.skill.localeCompare(b.skill);
  if (skillCompare !== 0) {
    return skillCompare;
  }
  return a.tripod.localeCompare(b.tripod);
}