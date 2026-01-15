export class ProgressBar {
  private current = 0;
  private total: number;
  private width = 30;

  constructor(total: number) {
    this.total = total;
  }

  update(current: number): void {
    this.current = Math.min(current, this.total);
    this.render();
  }

  increment(): void {
    this.update(this.current + 1);
  }

  private render(): void {
    const percentage = (this.current / this.total) * 100;
    const filled = Math.round((this.current / this.total) * this.width);
    const bar = '█'.repeat(filled) + '░'.repeat(this.width - filled);
    const pct = percentage.toFixed(1);
    process.stdout.write(`\r[${bar}] ${pct}%`);
  }

  complete(): void {
    this.update(this.total);
    process.stdout.write('\n');
  }
}

export function spinner(message: string): NodeJS.Timeout {
  const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  let i = 0;
  return setInterval(() => {
    process.stdout.write(`\r${frames[i % frames.length]} ${message}`);
    i += 1;
  }, 80);
}

export function clearSpinner(id: NodeJS.Timeout): void {
  clearInterval(id);
  process.stdout.write('\r\x1b[K');
}
