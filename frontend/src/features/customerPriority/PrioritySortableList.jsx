import { useMemo } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

function SortablePriorityRow({ customer, disabled }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: String(customer.id),
    disabled,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.85 : 1,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`customer-priority-row${isDragging ? " is-dragging" : ""}`}
    >
      <button
        type="button"
        className="customer-priority-handle"
        aria-label="Drag to reorder"
        disabled={disabled}
        {...attributes}
        {...listeners}
      >
        <span aria-hidden="true">☰</span>
      </button>
      <span className="customer-priority-rank">{customer.priority}</span>
      <span className="customer-priority-name">{customer.name}</span>
      <span className="customer-priority-depot">{customer.depotName || "—"}</span>
    </li>
  );
}

export function PrioritySortableList({ customers, onReorder, disabled = false }) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const ids = useMemo(() => customers.map((c) => String(c.id)), [customers]);

  function handleDragEnd(event) {
    if (disabled) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = ids.indexOf(String(active.id));
    const newIndex = ids.indexOf(String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;
    const next = arrayMove(customers, oldIndex, newIndex).map((row, index) => ({
      ...row,
      priority: index + 1,
    }));
    onReorder(next);
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <ul className="customer-priority-list">
          {customers.map((customer) => (
            <SortablePriorityRow key={customer.id} customer={customer} disabled={disabled} />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}
