import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { Invoice, Vendor, Alert, GSTSummary } from "./types";

// ─── FIX 1: ensure baseUrl always ends with "/" ───────────────────────────────
// RTK fetchBaseQuery concatenates baseUrl + endpoint string directly.
// "http://localhost:9000" + "upload/invoices" = "http://localhost:9000upload/invoices" ❌
// "http://localhost:9000/" + "upload/invoices" = "http://localhost:9000/upload/invoices" ✅
const rawBase: string = import.meta.env.VITE_BASE_URL ?? "http://localhost:9000/";
const baseUrl = rawBase.endsWith("/") ? rawBase : rawBase + "/";

export const api = createApi({
  baseQuery: fetchBaseQuery({
    baseUrl,
    // ⚠️  Do NOT put a global Content-Type header here.
    //     It would override the multipart/form-data boundary for file uploads.
  }),
  reducerPath: "main",
  tagTypes: ["Invoices", "Vendors", "Alerts", "Summary"],
  endpoints: (build) => ({
    getInvoices: build.query<Array<Invoice>, void>({
      query: () => "invoice/invoices/",
      providesTags: ["Invoices"],
    }),
    getVendors: build.query<Array<Vendor>, void>({
      query: () => "vendor/vendors/",
      providesTags: ["Vendors"],
    }),
    getAlerts: build.query<Array<Alert>, void>({
      query: () => "alert/alerts/",
      providesTags: ["Alerts"],
    }),
    getGSTSummary: build.query<GSTSummary, void>({
      query: () => "summary/gst-summary/",
      providesTags: ["Summary"],
    }),

    // ─── FIX 2: formData: true ──────────────────────────────────────────────
    // Without this flag, fetchBaseQuery calls JSON.stringify(formData) → sends
    // body="{}" with Content-Type: application/json → multer gets no file →
    // req.file is undefined → upload fails every single time.
    //
    // With formData: true, RTK passes the FormData object directly to fetch().
    // fetch() then sets Content-Type: multipart/form-data; boundary=<uuid>
    // automatically, multer reads it correctly, req.file is populated. ✅
    uploadFile: build.mutation<
      { success: boolean; rowCount: number; data: Invoice[]; fileName: string },
      { type: "invoices" | "gstr2b"; file: File }
    >({
      query: ({ type, file }) => {
        const formData = new FormData();
        formData.append("file", file);
        return {
          url:      `upload/${type}`,
          method:   "POST",
          body:     formData,
          formData: true,   // ← THE critical flag. Do not remove.
        };
      },
      invalidatesTags: ["Invoices", "Vendors", "Alerts", "Summary"],
    }),
  }),
});

export const {
  useGetInvoicesQuery,
  useGetVendorsQuery,
  useGetAlertsQuery,
  useGetGSTSummaryQuery,
  useUploadFileMutation,
} = api;