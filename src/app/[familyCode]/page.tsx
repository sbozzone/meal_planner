"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { Header } from "@/components/layout/Header";
import { WeekNavigation } from "@/components/meal-plan/WeekNavigation";
import { DayCard } from "@/components/meal-plan/DayCard";
import { TonightHero } from "@/components/meal-plan/TonightHero";
import { WeekProgress } from "@/components/meal-plan/WeekProgress";
import { Confetti } from "@/components/shared/Confetti";
import { DishPicker } from "@/components/meal-plan/DishPicker";
import { ActivitySheet } from "@/components/meal-plan/ActivitySheet";
import { ChefPickerSheet } from "@/components/meal-plan/ChefPickerSheet";
import { DishForm } from "@/components/dishes/DishForm";
import { PrintSheet } from "@/components/print/PrintSheet";
import { TemplatesModal } from "@/components/templates/TemplatesModal";
import { PlanningWizard } from "@/components/meal-plan/PlanningWizard";
import { useWeekNavigation } from "@/hooks/useWeekNavigation";
import { useMealPlan } from "@/hooks/useMealPlan";
import { useDinnerActivities } from "@/hooks/useDinnerActivities";
import { useChefAssignments } from "@/hooks/useChefAssignments";
import { useDishes } from "@/hooks/useDishes";
import { useShoppingList } from "@/hooks/useShoppingList";
import { useConfirmAction } from "@/hooks/useConfirmAction";
import { useFamily } from "@/lib/family-context";
import type { DinnerActivity, Dish } from "@/types/database";

export default function MealPlanPage() {
  const { family } = useFamily();
  const { weekStart, weekLabel, mode, toggleMode, goToPrevWeek, goToNextWeek } =
    useWeekNavigation();
  const { days, loading, assignDish, assignCustomMeal, removeMeal, clearWeek } =
    useMealPlan(weekStart);
  const {
    activities,
    loading: activitiesLoading,
    addActivity,
    updateActivity,
    deleteActivity,
  } = useDinnerActivities(weekStart);
  const { assignments: chefAssignments, setChef, clearChef } =
    useChefAssignments(weekStart);
  const { dishes, addDish, refetch: refetchDishes } = useDishes();
  const { items } = useShoppingList();

  const [pickerDate, setPickerDate] = useState<string | null>(null);
  const [activityDate, setActivityDate] = useState<string | null>(null);
  const [editingActivity, setEditingActivity] =
    useState<DinnerActivity | null>(null);
  const [chefDate, setChefDate] = useState<string | null>(null);
  const [pendingDate, setPendingDate] = useState<string | null>(null);
  const [showAddDish, setShowAddDish] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showWizard, setShowWizard] = useState(false);
  const [confettiBurst, setConfettiBurst] = useState(0);
  const prevPlannedRef = useRef<number | null>(null);
  const clearConfirm = useConfirmAction(clearWeek);

  // Celebrate the moment the last empty night gets filled
  const plannedCount = useMemo(
    () => days.filter((d) => d.meals.length > 0).length,
    [days]
  );
  useEffect(() => {
    if (loading) return;
    const prev = prevPlannedRef.current;
    if (prev !== null && prev < days.length && plannedCount === days.length) {
      setConfettiBurst((b) => b + 1);
    }
    prevPlannedRef.current = plannedCount;
  }, [plannedCount, days.length, loading]);

  const daysWithAll = useMemo(
    () =>
      days.map((day) => ({
        ...day,
        activities: activities.filter(
          (activity) => activity.activity_date === day.date
        ),
        chef: chefAssignments.find((c) => c.chef_date === day.date)?.chef_name ?? null,
      })),
    [days, activities, chefAssignments]
  );

  const handleTapToAssign = useCallback((date: string) => {
    setPickerDate(date);
  }, []);

  const handleSelectDish = useCallback(async (dish: Dish) => {
    if (pickerDate) {
      await assignDish(pickerDate, dish.id);
      setPickerDate(null);
    }
  }, [pickerDate, assignDish]);

  const handleSelectCustomMeal = useCallback(async (name: string) => {
    if (pickerDate) {
      await assignCustomMeal(pickerDate, name);
      setPickerDate(null);
    }
  }, [pickerDate, assignCustomMeal]);

  const handleAddActivity = useCallback((date: string) => {
    setEditingActivity(null);
    setActivityDate(date);
  }, []);

  const handleEditActivity = useCallback((activity: DinnerActivity) => {
    setEditingActivity(activity);
    setActivityDate(activity.activity_date);
  }, []);

  const currentChefForDate = chefDate
    ? (chefAssignments.find((c) => c.chef_date === chefDate)?.chef_name ?? null)
    : null;

  const handleSurpriseMe = useCallback(async () => {
    const today = daysWithAll.find((d) => d.isToday);
    if (!today || dishes.length === 0) return;
    const dish = dishes[Math.floor(Math.random() * dishes.length)];
    await assignDish(today.date, dish.id);
  }, [daysWithAll, dishes, assignDish]);

  return (
    <>
      <Header
        subtitle={weekLabel}
        showPrint
        familyCode={family.share_code}
        onTemplatesClick={() => setShowTemplates(true)}
        onWizardClick={() => setShowWizard(true)}
      />

      <WeekNavigation
        weekLabel={weekLabel}
        mode={mode}
        onToggleMode={toggleMode}
        onPrev={goToPrevWeek}
        onNext={goToNextWeek}
        onClearWeek={clearConfirm.trigger}
        confirmClear={clearConfirm.armed}
      />

      <main className="px-4 pb-4 max-w-3xl mx-auto print:hidden">
        {loading || activitiesLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 7 }).map((_, i) => (
              <div
                key={i}
                className="h-28 animate-pulse rounded-2xl border border-border-light bg-card/70 shadow-warm-sm"
              />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            <WeekProgress days={daysWithAll} onSelectDay={handleTapToAssign} />
            {daysWithAll.map((day, i) =>
              day.isToday ? (
                <TonightHero
                  key={day.date}
                  day={day}
                  familyId={family.id}
                  onTapToAssign={handleTapToAssign}
                  onAddActivity={handleAddActivity}
                  onEditActivity={handleEditActivity}
                  onRemoveMeal={removeMeal}
                  onSetChef={setChefDate}
                  onSurpriseMe={handleSurpriseMe}
                  canSurprise={dishes.length > 0}
                />
              ) : (
                <DayCard
                  key={day.date}
                  day={day}
                  index={i}
                  onTapToAssign={handleTapToAssign}
                  onAddActivity={handleAddActivity}
                  onEditActivity={handleEditActivity}
                  onRemoveMeal={removeMeal}
                  onSetChef={setChefDate}
                  familyId={family.id}
                />
              )
            )}
          </div>
        )}
      </main>

      <Confetti burst={confettiBurst} />

      <PrintSheet
        familyName={family.name}
        weekLabel={weekLabel}
        days={daysWithAll}
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
        onSelectCustom={handleSelectCustomMeal}
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
            memory_image_url: extras.memoryImageFile ? null : extras.memory_image_url,
            appliances: extras.appliances,
            source_url: extras.source_url,
            instructions: extras.instructions,
            prep_time: extras.prep_time,
            cook_time: extras.cook_time,
            servings: extras.servings,
          });
          if (dish && extras.memoryImageFile) {
            const form = new FormData();
            form.append("image", extras.memoryImageFile);
            await fetch(`/api/dishes/${dish.id}/memory/upload`, {
              method: "POST",
              headers: { "x-family-id": family.id },
              body: form,
            });
            await refetchDishes();
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

      <PlanningWizard
        open={showWizard}
        familyId={family.id}
        days={daysWithAll.map((d) => ({
          date: d.date,
          shortName: d.shortName,
          dayName: d.dayName,
          dayNumber: d.dayNumber,
          isToday: d.isToday,
          isEmpty: d.meals.length === 0,
        }))}
        dishes={dishes}
        onClose={() => setShowWizard(false)}
        onAssignDish={assignDish}
        onAssignCustom={assignCustomMeal}
        onSaveToLibrary={(name) => addDish(name, [], [])}
      />

      <ChefPickerSheet
        open={chefDate !== null}
        currentChef={currentChefForDate}
        members={family.members ?? []}
        onClose={() => setChefDate(null)}
        onSave={async (name) => {
          if (chefDate) await setChef(chefDate, name);
        }}
        onClear={async () => {
          if (chefDate) await clearChef(chefDate);
        }}
      />
    </>
  );
}
