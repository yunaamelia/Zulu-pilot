/**
 * Feature Degradation
 *
 * Graceful degradation for unsupported features
 * T061 [US1] - Graceful degradation (display clear message: "Feature X not available with provider Y" per FR-020)
 *
 * @package @zulu-pilot/cli
 */

/**
 * Feature Degradation Configuration
 */
export interface FeatureDegradationConfig {
  /**
   * Whether to show warnings for degraded features
   * Default: true
   */
  showWarnings?: boolean;

  /**
   * Output stream (stderr or custom)
   */
  outputStream?: NodeJS.WritableStream;
}

/**
 * Feature Degradation
 *
 * Handles graceful degradation when features are not available with a provider
 */
export class FeatureDegradation {
  private readonly config: Required<Omit<FeatureDegradationConfig, 'outputStream'>> & {
    outputStream?: NodeJS.WritableStream;
  };

  constructor(config: FeatureDegradationConfig = {}) {
    this.config = {
      showWarnings: config.showWarnings ?? true,
      outputStream: config.outputStream ?? process.stderr,
    };
  }

  /**
   * Display feature degradation message
   *
   * @param featureName - Name of the feature that's not available
   * @param providerName - Name of the provider that doesn't support it
   * @param alternative - Optional alternative feature or workaround
   */
  showDegradation(
    featureName: string,
    providerName: string,
    alternative?: string
  ): void {
    if (!this.config.showWarnings) {
      return;
    }

    const stream = this.config.outputStream || process.stderr;
    const warningColor = '\x1b[33m'; // Yellow
    const resetColor = '\x1b[0m'; // Reset
    const message = `Feature "${featureName}" is not available with provider "${providerName}".`;

    stream.write(`${warningColor}Warning: ${message}${resetColor}\n`);

    if (alternative) {
      stream.write(`${warningColor}Note: ${alternative}${resetColor}\n`);
    }
  }

  /**
   * Check if a feature is supported by a provider
   *
   * @param featureName - Name of the feature to check
   * @param providerName - Name of the provider
   * @param supportedFeatures - Map of provider to supported features
   * @returns True if feature is supported
   */
  isFeatureSupported(
    featureName: string,
    providerName: string,
    supportedFeatures: Map<string, Set<string>>
  ): boolean {
    const features = supportedFeatures.get(providerName);
    return features ? features.has(featureName) : false;
  }

  /**
   * Get supported features for a provider
   *
   * @param providerName - Name of the provider
   * @param supportedFeatures - Map of provider to supported features
   * @returns Set of supported feature names
   */
  getSupportedFeatures(
    providerName: string,
    supportedFeatures: Map<string, Set<string>>
  ): Set<string> {
    return supportedFeatures.get(providerName) || new Set();
  }

  /**
   * Register a feature as supported by a provider
   *
   * @param providerName - Name of the provider
   * @param featureName - Name of the feature
   * @param supportedFeatures - Map of provider to supported features
   */
  registerSupportedFeature(
    providerName: string,
    featureName: string,
    supportedFeatures: Map<string, Set<string>>
  ): void {
    if (!supportedFeatures.has(providerName)) {
      supportedFeatures.set(providerName, new Set());
    }
    supportedFeatures.get(providerName)!.add(featureName);
  }

  /**
   * Get a user-friendly message about feature support
   *
   * @param featureName - Name of the feature
   * @param providerName - Name of the provider
   * @param alternative - Optional alternative
   * @returns User-friendly message
   */
  getMessage(
    featureName: string,
    providerName: string,
    alternative?: string
  ): string {
    let message = `Feature "${featureName}" is not available with provider "${providerName}".`;
    
    if (alternative) {
      message += ` ${alternative}`;
    }

    return message;
  }

  /**
   * Toggle warnings display
   *
   * @param showWarnings - Whether to show warnings
   */
  toggleWarnings(showWarnings: boolean): void {
    this.config.showWarnings = showWarnings;
  }

  /**
   * Check if warnings are enabled
   *
   * @returns True if warnings are enabled
   */
  areWarningsEnabled(): boolean {
    return this.config.showWarnings;
  }
}

