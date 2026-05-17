import type { DayPlan, ShoppingItem } from "@/types/database";

export function PrintSheet({
  familyName,
  weekLabel,
  days,
  items,
}: {
  familyName: string;
  weekLabel: string;
  days: DayPlan[];
  items: ShoppingItem[];
}) {
  const unchecked = items.filter((it) => !it.is_checked);

  // Group by category, preserve aisle order
  const CATEGORY_ORDER = [
    "Produce",
    "Meat & Seafood",
    "Dairy & Eggs",
    "Bakery",
    "Frozen",
    "Pantry",
    "Canned Goods",
    "Condiments",
    "Snacks",
    "Beverages",
    "Other",
  ];
  const grouped = unchecked.reduce<Record<string, ShoppingItem[]>>((acc, item) => {
    const cat = item.category || "Other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});
  const sortedGroups = Object.entries(grouped).sort(
    ([a], [b]) =>
      (CATEGORY_ORDER.indexOf(a) === -1 ? 99 : CATEGORY_ORDER.indexOf(a)) -
      (CATEGORY_ORDER.indexOf(b) === -1 ? 99 : CATEGORY_ORDER.indexOf(b))
  );

  return (
    <div className="hidden print:block print-sheet">
      {/* Header */}
      <div className="print-header">
        <span className="print-family">{familyName}</span>
        <span className="print-week">{weekLabel}</span>
      </div>

      <div className="print-body">
        {/* Left: Meal plan */}
        <div className="print-meals">
          <div className="print-section-title">Dinners</div>
          <table className="print-table">
            <tbody>
              {days.map((day) => (
                <tr key={day.date} className={day.isToday ? "print-today" : ""}>
                  <td className="print-day-cell">
                    <span className="print-day-name">{day.shortName}</span>
                    <span className="print-day-num">{day.dayNumber}</span>
                  </td>
                  <td className="print-meal-cell">
                    {day.meals.length === 0 ? (
                      <span className="print-empty">—</span>
                    ) : (
                      day.meals.map((meal, i) => (
                        <div key={meal.id} className={i > 0 ? "print-side" : "print-main"}>
                          {i > 0 && <span className="print-side-label">side: </span>}
                          {meal.dish?.name || meal.custom_name || "—"}
                        </div>
                      ))
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Right: Shopping list */}
        <div className="print-shopping">
          <div className="print-section-title">Shopping List</div>
          {sortedGroups.length === 0 ? (
            <p className="print-empty">No items yet</p>
          ) : (
            sortedGroups.map(([cat, catItems]) => (
              <div key={cat} className="print-category">
                <div className="print-category-name">{cat}</div>
                {catItems.map((item) => (
                  <div key={item.id} className="print-item">
                    <span className="print-checkbox" />
                    <span className="print-item-name">{item.name}</span>
                    {item.quantity && (
                      <span className="print-item-qty">{item.quantity}</span>
                    )}
                  </div>
                ))}
              </div>
            ))
          )}
        </div>
      </div>

      <div className="print-footer">
        Printed {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
      </div>
    </div>
  );
}
