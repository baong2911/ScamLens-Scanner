export const categories = {
  job: "Job offer",
  rental: "Rental listing",
  market: "Marketplace deal",
};
export const examples = {
  job: "Congratulations! We will send you a check to buy equipment. Deposit the check and send the remaining balance back. Contact our hiring manager on Telegram.",
  rental:
    "I am out of the country and cannot show the apartment. Pay the deposit before viewing to reserve it. Send a wire transfer today.",
  market:
    "To prove you are real, send me the verification code. Pay with gift cards to hold the item.",
};
const rules = [
  [
    "fee",
    "Advance payment",
    35,
    /\b(?:pay|send|wire)\b[^.!?\n]{0,85}\b(?:fee|deposit)\b[^.!?\n]{0,45}\b(?:first|before|upfront|in advance)\b/i,
    "Verify the organization and payment terms independently before paying.",
  ],
  [
    "payment",
    "Hard-to-reverse payment",
    45,
    /\b(?:pay|send|payment)\b[^.!?\n]{0,70}\b(?:gift cards?|crypto(?:currency)?|bitcoin|wire transfer)\b/i,
    "Pause payment and verify through the official organization or platform.",
  ],
  [
    "code",
    "Verification code request",
    55,
    /\b(?:send|share|give|text)\b[^.!?\n]{0,65}\b(?:verification|security|one-time) code\b/i,
    "Keep the code private and verify the request through the platform.",
  ],
  [
    "pressure",
    "Time pressure",
    15,
    /\b(?:act now|pay today|send.{0,30}today|limited time|immediately or)\b/i,
    "Take time to verify the offer independently.",
  ],
  [
    "check",
    "Check and equipment purchase",
    55,
    /\b(?:send|mail)\b[^.!?\n]{0,45}\bcheck\b[^.!?\n]{0,85}\b(?:buy|purchase|equipment)\b/i,
    "Confirm the offer with HR using contact details from the official careers site.",
    "job",
  ],
  [
    "chat",
    "Hiring moved to a messaging app",
    15,
    /\b(?:contact|interview|message)\b[^.!?\n]{0,100}\b(?:telegram|whatsapp|signal)\b/i,
    "Confirm the recruiter through the employer’s published contact details.",
    "job",
  ],
  [
    "tour",
    "Property viewing unavailable",
    35,
    /\b(?:cannot show|can.t show|out of the country|unable to show)\b[^.!?\n]{0,75}/i,
    "Find the property manager independently and arrange a tour before paying.",
    "rental",
  ],
  [
    "offsite",
    "Request to move off-platform",
    20,
    /\b(?:outside (?:the )?(?:app|platform)|friends and family|off.platform)\b/i,
    "Keep communication and payment in the marketplace when it offers protection.",
    "market",
  ],
];
export const nextSteps = {
  job: "Look for the position on the employer’s official careers site and confirm who contacted you.",
  rental:
    "Look up the address and confirm the listing with the property manager before sending money.",
  market:
    "Review the seller’s history and use the marketplace’s official checkout when available.",
};
export function analyze(input, category) {
  if (!Object.hasOwn(categories, category))
    throw new Error("Choose a listing type.");
  const text = input.trim();
  if (text.length < 20 || text.length > 12000)
    throw new Error("Enter between 20 and 12,000 characters.");
  const flags = [];
  for (const [id, title, weight, pattern, action, scope] of rules) {
    if (scope && scope !== category) continue;
    const match = pattern.exec(text);
    if (match) flags.push({ id, title, weight, evidence: match[0], action });
  }
  flags.sort((a, b) => b.weight - a.weight);
  const score = Math.min(
    100,
    flags.reduce((sum, flag) => sum + flag.weight, 0),
  );
  const level =
    score >= 55
      ? "Strong signals"
      : score
        ? "Review recommended"
        : "No supported signals matched";
  return { category, score, level, flags, nextStep: nextSteps[category] };
}
