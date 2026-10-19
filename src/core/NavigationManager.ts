export type Panel = 'tasks' | 'sensors';
export type SortKey = 'cpu' | 'mem' | 'pid' | 'name';

const SORT_ORDER: SortKey[] = ['cpu', 'mem', 'pid', 'name'];

export class NavigationManager {
  panel: Panel = 'tasks';
  selected = 0;
  sortKey: SortKey = 'cpu';
  confirmKill = false;

  nextPanel(): void {
    this.panel = this.panel === 'tasks' ? 'sensors' : 'tasks';
    this.confirmKill = false;
  }

  move(delta: number, total: number): void {
    if (total <= 0) return;
    this.selected = Math.max(0, Math.min(total - 1, this.selected + delta));
    this.confirmKill = false;
  }

  clamp(total: number): void {
    this.selected = Math.max(0, Math.min(Math.max(total - 1, 0), this.selected));
  }

  cycleSort(): void {
    const i = SORT_ORDER.indexOf(this.sortKey);
    this.sortKey = SORT_ORDER[(i + 1) % SORT_ORDER.length];
  }

  askKill(): void {
    this.confirmKill = true;
  }

  cancelKill(): void {
    this.confirmKill = false;
  }
}