import { api } from "./api";
import toast from "react-hot-toast";

/**
 * Download a PDF report for a given prediction ID.
 * Uses axios so the JWT auth token is included automatically.
 */
export async function downloadPdf(predictionId: number): Promise<void> {
  const toastId = toast.loading("Generating PDF report…");
  try {
    const res = await api.get(`/reports/pdf/${predictionId}`, {
      responseType: "blob",
    });

    const blob = new Blob([res.data], { type: "application/pdf" });
    const url  = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href     = url;
    link.download = `VoiceCortex_Report_${predictionId}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success("PDF downloaded!", { id: toastId });
  } catch (err: unknown) {
    const axiosErr = err as { response?: { status?: number } };
    if (axiosErr.response?.status === 401) {
      toast.error("Please sign in to download PDF reports.", { id: toastId });
    } else if (axiosErr.response?.status === 404) {
      toast.error("Prediction not found.", { id: toastId });
    } else {
      toast.error("Failed to generate PDF. Try again.", { id: toastId });
    }
  }
}

/**
 * Download Excel or CSV history export.
 */
export async function downloadExport(type: "excel" | "csv"): Promise<void> {
  const ext    = type === "excel" ? "xlsx" : "csv";
  const toastId = toast.loading(`Generating ${type.toUpperCase()} export…`);
  try {
    const res = await api.get(`/reports/${type}`, { responseType: "blob" });

    const mimeTypes = {
      excel: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      csv:   "text/csv",
    };
    const blob = new Blob([res.data], { type: mimeTypes[type] });
    const url  = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href     = url;
    link.download = `VoiceCortex_Export.${ext}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success(`${ext.toUpperCase()} downloaded!`, { id: toastId });
  } catch (err: unknown) {
    const axiosErr = err as { response?: { status?: number; data?: { detail?: string } } };
    if (axiosErr.response?.status === 404) {
      toast.error("No prediction history to export yet.", { id: toastId });
    } else {
      toast.error(`Export failed: ${axiosErr.response?.data?.detail || "unknown error"}`, { id: toastId });
    }
  }
}
