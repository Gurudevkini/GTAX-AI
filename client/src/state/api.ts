import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { Invoice, Vendor, Alert, GSTSummary } from "./types";

const rawBase: string = import.meta.env.VITE_BASE_URL ?? "http://localhost:9000/";
const baseUrl = rawBase.endsWith("/") ? rawBase : rawBase + "/";

export interface AuthUser {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  gstin: string;
}

export const api = createApi({
  baseQuery: fetchBaseQuery({ baseUrl }),
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
    uploadFile: build.mutation<
      { success: boolean; rowCount: number; data: Invoice[]; fileName: string },
      { type: "invoices" | "gstr2b"; file: File }
    >({
      query: ({ type, file }) => {
        const formData = new FormData();
        formData.append("file", file);
        return {
          url: `upload/${type}`,
          method: "POST",
          body: formData,
          formData: true,
        };
      },
      invalidatesTags: ["Invoices", "Vendors", "Alerts", "Summary"],
    }),
    resetData: build.mutation<{ success: boolean; message: string }, void>({
      query: () => ({ url: "upload/reset", method: "POST" }),
      invalidatesTags: ["Invoices", "Vendors", "Alerts", "Summary"],
    }),
    login: build.mutation<
      { success: boolean; token: string; user: AuthUser },
      { email: string; password: string }
    >({
      query: (body) => ({ url: "auth/login", method: "POST", body }),
    }),
    register: build.mutation<
      { success: boolean; token: string; user: AuthUser },
      { firstName: string; lastName: string; email: string; gstin?: string; password: string }
    >({
      query: (body) => ({ url: "auth/register", method: "POST", body }),
    }),
  }),
});

export const {
  useGetInvoicesQuery,
  useGetVendorsQuery,
  useGetAlertsQuery,
  useGetGSTSummaryQuery,
  useUploadFileMutation,
  useResetDataMutation,
  useLoginMutation,
  useRegisterMutation,
} = api;