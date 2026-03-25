export interface Detection {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  class_name: string;
  class_id: number;
  confidence: number;
  color: [number, number, number];
}

export interface DetectionFrame {
  camera_id: number;
  timestamp: number;
  detections: Detection[];
  frame_width: number;
  frame_height: number;
  total_vehicles: number;
  emergency_count: number;
  processing_time_ms: number;
}

export class OptimizedAIDetectionClient {
  private apiUrl: string;
  private cameraId: number;
  private pollIntervalMs: number;
  private isPollActive: boolean = false;

  constructor(apiUrl: string, cameraId: number, pollIntervalMs: number = 350) {
    this.apiUrl = apiUrl;
    this.cameraId = cameraId;
    this.pollIntervalMs = pollIntervalMs;
  }

  /**
   * STEP 1: Submit canvas frame for background processing (NON-BLOCKING)
   */
  async submitCanvasFrame(canvas: HTMLCanvasElement): Promise<void> {
    try {
      // Convert canvas to blob
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((b) => resolve(b!), "image/jpeg", 0.8);
      });

      // Create FormData
      const formData = new FormData();
      formData.append("file", blob, "frame.jpg");

      // Send to backend (fire-and-forget)
      // ✅ Returns immediately - doesn't wait for processing
      fetch(`${this.apiUrl}/submit-frame/${this.cameraId}`, {
        method: "POST",
        body: formData,
      }).catch((e) => console.warn(`Frame submission error: ${e}`));

      // NOTE: Processing happens in background on server
      // Detections available via polling GET /detections/{camera_id}
    } catch (error) {
      console.error("Canvas frame submission error:", error);
    }
  }

  /**
   * STEP 2: Start polling for detection results (LIGHTWEIGHT)
   * Returns callback that fires whenever new detections arrive
   */
  startPollingDetections(
    onDetectionsUpdate: (detections: DetectionFrame) => void,
    onError?: (error: Error) => void,
  ): () => void {
    if (this.isPollActive) return () => {};

    this.isPollActive = true;

    const pollInterval = setInterval(async () => {
      try {
        // ✅ Lightweight request: just get detection metadata (~5KB)
        // NOT: full image transmission (~500KB)
        const response = await fetch(
          `${this.apiUrl}/detections/${this.cameraId}`,
          {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            // Abort after 5 seconds if no response
            signal: AbortSignal.timeout(5000),
          },
        );

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const detection: DetectionFrame = await response.json();
        onDetectionsUpdate(detection);
      } catch (error) {
        if (onError) {
          onError(error instanceof Error ? error : new Error(String(error)));
        }
      }
    }, this.pollIntervalMs);

    // Return cleanup function
    return () => {
      this.isPollActive = false;
      clearInterval(pollInterval);
    };
  }

  /**
   * Get all detections from all cameras in single call
   */
  async getAllDetections(): Promise<Record<number, DetectionFrame>> {
    const response = await fetch(`${this.apiUrl}/detections`, {
      method: "GET",
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.json();
  }

  /**
   * Get health status of API
   */
  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiUrl}/health`, {
        signal: AbortSignal.timeout(3000),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * STEP 3: Render detections on canvas (YOUR responsibility)
   *
   * Example:
   * ```
   * function renderDetections(
   *   ctx: CanvasRenderingContext2D,
   *   detectionFrame: DetectionFrame,
   *   canvasWidth: number,
   *   canvasHeight: number
   * ) {
   *   for (const det of detectionFrame.detections) {
   *     // Scale to canvas coordinates
   *     const scaleX = canvasWidth / detectionFrame.frame_width;
   *     const scaleY = canvasHeight / detectionFrame.frame_height;
   *
   *     const x1 = det.x1 * scaleX;
   *     const y1 = det.y1 * scaleY;
   *     const x2 = det.x2 * scaleX;
   *     const y2 = det.y2 * scaleY;
   *     const w = x2 - x1;
   *     const h = y2 - y1;
   *     const [r, g, b] = det.color;
   *
   *     // Draw rectangle
   *     ctx.strokeStyle = `rgb(${r},${g},${b})`;
   *     ctx.lineWidth = 2;
   *     ctx.strokeRect(x1, y1, w, h);
   *
   *     // Draw label
   *     ctx.fillStyle = `rgb(${r},${g},${b})`;
   *     ctx.font = "12px Arial";
   *     ctx.fillText(`${det.class_name} ${det.confidence.toFixed(2)}`, x1, y1 - 5);
   *   }
   * }
   * ```
   */
  static renderDetections(
    ctx: CanvasRenderingContext2D,
    detectionFrame: DetectionFrame,
    canvasWidth: number,
    canvasHeight: number,
  ): void {
    const scaleX = canvasWidth / detectionFrame.frame_width;
    const scaleY = canvasHeight / detectionFrame.frame_height;

    for (const det of detectionFrame.detections) {
      const x1 = det.x1 * scaleX;
      const y1 = det.y1 * scaleY;
      const x2 = det.x2 * scaleX;
      const y2 = det.y2 * scaleY;
      const w = x2 - x1;
      const h = y2 - y1;
      const [r, g, b] = det.color;

      // Draw bounding box
      ctx.strokeStyle = `rgb(${r},${g},${b})`;
      ctx.lineWidth = 2;
      ctx.strokeRect(x1, y1, w, h);

      // Draw label text
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.font = "bold 12px Arial";
      ctx.fillText(
        `${det.class_name} ${det.confidence.toFixed(2)}`,
        x1,
        y1 - 5,
      );
    }
  }
}

/**
 * ✨ USAGE EXAMPLE
 *
 * const client = new OptimizedAIDetectionClient(
 *   "http://localhost:8000",
 *   0 // camera_id
 * );
 *
 * // 1. Submit frames periodically
 * setInterval(() => {
 *   client.submitCanvasFrame(myCanvas);
 * }, 350);
 *
 * // 2. Poll for results periodically
 * const stopPolling = client.startPollingDetections((detectionFrame) => {
 *   // Render detections on your canvas
 *   const ctx = myCanvas.getContext("2d")!;
 *   OptimizedAIDetectionClient.renderDetections(
 *     ctx,
 *     detectionFrame,
 *     myCanvas.width,
 *     myCanvas.height
 *   );
 * });
 *
 * // Later: stop polling
 * stopPolling();
 */
