# ESL Letter Challenge - Category Cards

This folder contains all the category cards for the ESL Letter Challenge game.

## Folder Structure

```
categories/
├── A1/          # Beginner level (10 cards)
├── A2/          # Elementary level (12 cards)
├── B1/          # Intermediate level (14 cards)
├── B2/          # Upper Intermediate level (14 cards)
├── C1/          # Advanced level (14 cards)
└── C2/          # Proficiency level (14 cards)
```

## File Format

Each card is a text file (`.txt`) with exactly **10 categories**, one per line.

### Example: `card1.txt`
```
A color
A food
An animal
A country
A boy's name
A girl's name
A number
A day of the week
A fruit
A sport
```

## How to Add More Cards

1. Navigate to the appropriate ESL level folder (A1, A2, B1, B2, C1, or C2)
2. Create a new file named `cardX.txt` where X is the next number (e.g., if you have card14.txt, create card15.txt)
3. Add exactly 10 categories, one per line
4. Save the file
5. Update the `CARD_COUNTS` object in `/src/app/page.tsx` to reflect the new total:
   ```typescript
   const CARD_COUNTS: Record<ESLLevel, number> = {
     A1: 10,  // Update these numbers
     A2: 12,
     B1: 14,
     B2: 14,
     C1: 14,
     C2: 14,
   };
   ```

## Tips for Creating Categories

- Keep categories appropriate for the ESL level
- Use clear, simple language
- Start each category with "A" or "An" for consistency
- Ensure categories are broad enough to allow multiple answers
- Test categories with students to ensure they're not too difficult or too easy

## Editing Existing Cards

Simply open any `.txt` file and modify the categories. Changes will be reflected immediately in the game.
