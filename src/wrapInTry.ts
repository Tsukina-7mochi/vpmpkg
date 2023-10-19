// deno-lint-ignore-file no-explicit-any
const wrapInTry = function<T extends (...args: any) => any>(
  func: T, defaultValue: (err: any) => ReturnType<T>
): (...args: Parameters<T>) => ReturnType<T> {
  return function(...args: Parameters<T>): ReturnType<T> {
    try {
      return func.apply(null, args);
    } catch(err) {
      return defaultValue(err);
    }
  }
}

export default wrapInTry;
