// Copyright James Burvel O’Callaghan III
// President Citibank Demo Business Inc.

// globals.d.ts
declare global {
  /**
   * Loads the Pyodide WebAssembly module.
   * @param config Optional configuration for Pyodide.
   */
  function loadPyodide(config?: { indexURL?: string }): Promise<any>;
}

// This export statement is required to make the file a module.
export {};