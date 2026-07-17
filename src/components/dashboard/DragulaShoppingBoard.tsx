import { useEffect, useRef } from "react";
import dragula, { type Drake } from "dragula";
import "dragula/dist/dragula.css";
import type { ShoppingItem } from "../../data/familyData";
import { FeatherIconTile } from "../icons/FeatherIcon";

type Props = {
  items: ShoppingItem[];
  onSetPurchased: (id: string, purchased: boolean) => void;
  onOpenShopping: () => void;
};

/**
 * AdminUX-style drag-and-drop board powered by dragula.
 * Columns: To buy ↔ Purchased.
 * On drop we revert dragula's DOM move and update React state so React stays source of truth.
 */
export function DragulaShoppingBoard({ items, onSetPurchased, onOpenShopping }: Props) {
  const todoRef = useRef<HTMLDivElement>(null);
  const doneRef = useRef<HTMLDivElement>(null);
  const onSetPurchasedRef = useRef(onSetPurchased);

  useEffect(() => {
    onSetPurchasedRef.current = onSetPurchased;
  }, [onSetPurchased]);

  useEffect(() => {
    const todo = todoRef.current;
    const done = doneRef.current;
    if (!todo || !done) return;

    const drake: Drake = dragula([todo, done], {
      moves(el) {
        return Boolean((el as HTMLElement).dataset.itemId);
      },
      accepts(_el, target) {
        return target === todo || target === done;
      },
    });

    drake.on("drop", (el, target, source) => {
      const id = (el as HTMLElement).dataset.itemId;
      if (!id || !target || !source) return;

      // Hand DOM back to React — prevent double-mount glitches.
      source.appendChild(el);

      if (target === done) {
        onSetPurchasedRef.current(id, true);
      } else if (target === todo) {
        onSetPurchasedRef.current(id, false);
      }
    });

    return () => {
      drake.destroy();
    };
  }, []);

  const open = items.filter((i) => !i.purchased);
  const bought = items.filter((i) => i.purchased);

  return (
    <div className="aux-card mb-4">
      <div className="aux-card-header flex-wrap">
        <FeatherIconTile name="shopping-cart" tone="peach" size={18} />
        <div className="min-w-0 flex-1">
          <h3 className="text-base">Shopping board</h3>
          <p className="aux-muted">Drag items between columns (dragula)</p>
        </div>
        <button type="button" className="btn btn-light-color btn-accent" onClick={onOpenShopping}>
          Full shopping
        </button>
      </div>
      <div className="aux-card-body">
        <div className="aux-dragula-board">
          <section className="aux-dragula-col bg-gradient-5">
            <header className="aux-dragula-col__head">
              <span className="badge badge-light rounded-pill text-bg-warning">To buy</span>
              <span className="aux-muted text-sm">{open.length}</span>
            </header>
            <div ref={todoRef} className="aux-dragula-col__list" data-column="todo">
              {open.map((item) => (
                <DragCard key={item.id} item={item} />
              ))}
            </div>
            {open.length === 0 ? (
              <p className="aux-dragula-empty aux-muted">Drop items here to buy</p>
            ) : null}
          </section>

          <section className="aux-dragula-col bg-gradient-3">
            <header className="aux-dragula-col__head">
              <span className="badge badge-light rounded-pill text-bg-success">Purchased</span>
              <span className="aux-muted text-sm">{bought.length}</span>
            </header>
            <div ref={doneRef} className="aux-dragula-col__list" data-column="done">
              {bought.map((item) => (
                <DragCard key={item.id} item={item} />
              ))}
            </div>
            {bought.length === 0 ? (
              <p className="aux-dragula-empty aux-muted">Drag bought items here</p>
            ) : null}
          </section>
        </div>
      </div>
    </div>
  );
}

function DragCard({ item }: { item: ShoppingItem }) {
  return (
    <article className="aux-drag-card" data-item-id={item.id}>
      <span className="aux-drag-handle" aria-hidden>
        <i className="bi bi-grip-vertical" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="mb-0 fw-medium">{item.name}</p>
        <p className="aux-muted mb-0 text-sm">
          {item.quantity || "1"}
          {item.unit ? ` ${item.unit}` : ""}
          {item.storeSection ? ` · ${item.storeSection}` : ""}
        </p>
      </div>
    </article>
  );
}
