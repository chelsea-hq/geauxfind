"use client";
import { useState } from "react";

export function RecipeChecklist({ ingredients }: { ingredients: string[] }) {
  const [checked, setChecked] = useState<string[]>([]);
  return (
    <ul className="mt-3 space-y-2">
      {ingredients.map((ing) => (
        <li key={ing}>
          <label className="flex gap-2"><input type="checkbox" checked={checked.includes(ing)} onChange={() => setChecked((s) => s.includes(ing) ? s.filter((i) => i !== ing) : [...s, ing])} />{ing}</label>
        </li>
      ))}
    </ul>
  );
}
