const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

export function colorize(text: string, color: keyof typeof colors): string {
  return `${colors[color]}${text}${colors.reset}`;
}

export function success(text: string): string {
  return colorize(text, 'green');
}

export function warn(text: string): string {
  return colorize(text, 'yellow');
}

export function error(text: string): string {
  return colorize(text, 'red');
}

export function info(text: string): string {
  return colorize(text, 'cyan');
}

export function bold(text: string): string {
  return colorize(text, 'bright');
}

// Direct color functions
export function green(text: string): string {
  return colorize(text, 'green');
}

export function yellow(text: string): string {
  return colorize(text, 'yellow');
}

export function red(text: string): string {
  return colorize(text, 'red');
}

export function cyan(text: string): string {
  return colorize(text, 'cyan');
}
