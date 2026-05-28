import type { DayPlan, ShoppingItem } from "@/types/database";
import { FUN_OPTIONS } from "@/types/database";
import { getMealEmoji } from "@/lib/utils";

function getMealDisplay(name: string): string {
  const funOption = FUN_OPTIONS.find((o) => o.label === name);
  const emoji = funOption ? funOption.emoji : getMealEmoji(name);
  return emoji ? `${emoji} ${name}` : name;
}

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

  const categoryOrder = [
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
      (categoryOrder.indexOf(a) === -1 ? 99 : categoryOrder.indexOf(a)) -
      (categoryOrder.indexOf(b) === -1 ? 99 : categoryOrder.indexOf(b))
  );

  return (
    <div className="hidden print:block print-sheet">
      <div className="print-header">
        <span className="print-family">{familyName}</span>
        <span className="print-week">{weekLabel}</span>
      </div>

      <div className="print-body">
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
                    {day.chef && (
                      <div className="print-chef">👨‍🍳 {day.chef}</div>
                    )}
                    {day.meals.length === 0 && !day.activities?.length ? (
                      <span className="print-empty">-</span>
                    ) : (
                      <>
                        {day.meals.map((meal, i) => (
                          <div
                            key={meal.id}
                            className={i > 0 ? "print-side" : "print-main"}
                          >
                            {i > 0 && (
                              <span className="print-side-label">side: </span>
                            )}
                            {getMealDisplay(meal.dish?.name || meal.custom_name || "-")}
                          </div>
                        ))}
                        {day.activities?.map((activity) => (
                          <div key={activity.id} className="print-activity">
                            <span className="print-side-label">impact: </span>
                            {activity.title}
                            {activity.start_time
                              ? ` (${activity.start_time.slice(0, 5)})`
                              : ""}
                          </div>
                        ))}
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

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
        Printed{" "}
        {new Date().toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        })}
      </div>
    </div>
  );
}
