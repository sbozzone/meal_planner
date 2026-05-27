"use client";

import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { WeekNavigation } from "@/components/meal-plan/WeekNavigation";
import { DayCard } from "@/components/meal-plan/DayCard";
import { DishPicker } from "@/components/meal-plan/DishPicker";
import { ActivitySheet } from "@/components/meal-plan/ActivitySheet";
import { DishForm } from "@/components/dishes/DishForm";
import { PrintSheet } from "@/components/print/PrintSheet";
import { TemplatesModal } from "@/components/templates/TemplatesModal";
import { useWeekNavigation } from "@/hooks/useWeekNavigation";
import { useMealPlan } from "@/hooks/useMealPlan";
import { useDinnerActivities } from "@/hooks/useDinnerActivities";
import { useDishes } from "@/hooks/useDishes";
import { useShoppingList } from "@/hooks/useShoppingList";
import { useFamily } from "@/lib/family-context";
import type { DinnerActivity, Dish } from "@/types/database";

export default function MealPlanPage() {
  const { family } = useFamily();
  const { weekStart, weekLabel, goToPrevWeek, goToNextWeek, goToToday } =
    useWeekNavigation();
  const { days, loading, assignDish, removeMeal, clearWeek } =
    useMealPlan(weekStart);
  const {
    activities,
    loading: activitiesLoading,
    addActivity,
    updateActivity,
    deleteActivity,
  } = useDinnerActivities(weekStart);
  const { dishes, addDish } = useDishes();
  const { items } = useShoppingList();

  const [pickerDate, setPickerDate] = useState<string | null>(null);
  const [activityDate, setActivityDate] = useState<string | null>(null);
  const [editingActivity, setEditingActivity] =
    useState<DinnerActivity | null>(null);
  const [pendingDate, setPendingDate] = useState<string | null>(null);
  const [showAddDish, setShowAddDish] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const daysWithActivities = days.map((day) => ({
    ...day,
    activities: activities.filter(
      (activity) => activity.activity_date === day.date
    ),
  }));

  function handleTapToAssign(date: string) {
    setPickerDate(date);
  }

  async function handleSelectDish(dish: Dish) {
    if (pickerDate) {
      await assignDish(pickerDate, dish.id);
      setPickerDate(null);
    }
  }

  async function handleClearWeek() {
    if (confirmClear) {
      await clearWeek();
      setConfirmClear(false);
    } else {
      setConfirmClear(true);
      setTimeout(() => setConfirmClear(false), 3000);
    }
  }

  function handleAddActivity(date: string) {
    setEditingActivity(null);
    setActivityDate(date);
  }

  function handleEditActivity(activity: DinnerActivity) {
    setEditingActivity(activity);
    setActivityDate(activity.activity_date);
  }

  return (
    <>
      <Header
        subtitle={weekLabel}
        showPrint
        familyCode={family.share_code}
        onTemplatesClick={() => setShowTemplates(true)}
      />

      <WeekNavigation
        weekLabel={weekLabel}
        onPrev={goToPrevWeek}
        onNext={goToNextWeek}
        onToday={goToToday}
        onClearWeek={handleClearWeek}
        confirmClear={confirmClear}
      />

      <main className="px-4 pb-4 max-w-3xl mx-auto print:hidden">
        {loading || activitiesLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 7 }).map((_, i) => (
              <div
                key={i}
                className="h-24 rounded-card bg-card animate-pulse border border-border-light"
              />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {daysWithActivities.map((day) => (
              <DayCard
                key={day.date}
                day={day}
                onTapToAssign={handleTapToAssign}
                onAddActivity={handleAddActivity}
                onEditActivity={handleEditActivity}
                onRemoveMeal={removeMeal}
                familyId={family.id}
              />
            ))}
          </div>
        )}
      </main>

      <PrintSheet
        familyName={family.name}
        weekLabel={weekLabel}
        days={daysWithActivities}
        items={items}
      />

      <DishPicker
        open={pickerDate !== null}
        date={pickerDate}
        onClose={() => setPickerDate(null)}
        dishes={dishes}
        onSelect={handleSelectDish}
        onAddNew={() => {
          setPendingDate(pickerDate);
          setPickerDate(null);
          setShowAddDish(true);
        }}
        onAddAndSelect={async (name) => {
          const dish = await addDish(name, [], []);
          if (dish && pickerDate) {
            await assignDish(pickerDate, dish.id);
          }
        }}
      />

      <DishForm
        open={showAddDish}
        onClose={() => {
          setShowAddDish(false);
          setPendingDate(null);
        }}
        onSave={async (name, tags, ingredients, extras) => {
          const dish = await addDish(name, tags, ingredients, {
            is_memory: extras.is_memory,
            memory_story: extras.memory_story,
            memory_image_url: extras.memory_image_url,
            appliances: extras.appliances,
          });
          if (dish && extras.memoryImageFile) {
            const form = new FormData();
            form.append("image", extras.memoryImageFile);
            await fetch(`/api/dishes/${dish.id}/memory/upload`, {
              method: "POST",
              headers: { "x-family-id": family.id },
              body: form,
            });
          }
          if (dish && pendingDate) {
            await assignDish(pendingDate, dish.id);
          }
          setPendingDate(null);
        }}
      />

      <TemplatesModal
        open={showTemplates}
        onClose={() => setShowTemplates(false)}
        weekStart={weekStart}
        days={days}
        onLoaded={async () => {
          window.location.reload();
        }}
      />

      <ActivitySheet
        open={activityDate !== null}
        date={activityDate}
        activity={editingActivity}
        onClose={() => {
          setActivityDate(null);
          setEditingActivity(null);
        }}
        onSave={async (input) => {
          if (editingActivity) {
            await updateActivity(editingActivity.id, input);
          } else {
            await addActivity(input);
          }
        }}
        onDelete={deleteActivity}
      />
    </>
  );
}
