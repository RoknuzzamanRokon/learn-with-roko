/**
 * Transaction service for handling financial operations.
 */

import {
    Transaction,
    TransactionListResponse,
    TransactionFilter,
    PaymentIntentCreate,
    PaymentIntentResponse,
    RefundCreate,
    InstructorPayout,
    InstructorPayoutListResponse,
    InstructorEarnings,
    RevenueOverview,
    RevenueTrend,
    CourseRevenueAnalysis,
    InstructorRevenueAnalysis,
    PaymentMethodAnalysis,
    RefundAnalysis,
    FinancialDashboardData
} from '../types/transaction';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

class TransactionService {
    private async fetchWithAuth(url: string, options: RequestInit = {}) {
        const token = localStorage.getItem('access_token');

        const response = await fetch(`${API_BASE_URL}${url}`, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...(token && { Authorization: `Bearer ${token}` }),
                ...options.headers,
            },
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
        }

        return response.json();
    }

    // Transaction management
    async getTransactions(
        page: number = 1,
        perPage: number = 20,
        filters?: TransactionFilter
    ): Promise<TransactionListResponse> {
        const params = new URLSearchParams({
            page: page.toString(),
            per_page: perPage.toString(),
        });

        if (filters) {
            Object.entries(filters).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    params.append(key, value.toString());
                }
            });
        }

        return this.fetchWithAuth(`/transactions?${params}`);
    }

    async getMyTransactions(
        page: number = 1,
        perPage: number = 20
    ): Promise<TransactionListResponse> {
        const params = new URLSearchParams({
            page: page.toString(),
            per_page: perPage.toString(),
        });

        return this.fetchWithAuth(`/transactions/my?${params}`);
    }

    async getTransaction(transactionId: string): Promise<Transaction> {
        return this.fetchWithAuth(`/transactions/${transactionId}`);
    }

    async refundTransaction(
        transactionId: string,
        refundData: RefundCreate
    ): Promise<Transaction> {
        return this.fetchWithAuth(`/transactions/${transactionId}/refund`, {
            method: 'POST',
            body: JSON.stringify(refundData),
        });
    }

    // Payment processing
    async createPaymentIntent(
        paymentData: PaymentIntentCreate
    ): Promise<PaymentIntentResponse> {
        return this.fetchWithAuth('/transactions/payment-intent', {
            method: 'POST',
            body: JSON.stringify(paymentData),
        });
    }

    // Instructor payouts
    async getInstructorPayouts(
        page: number = 1,
        perPage: number = 20,
        instructorId?: number
    ): Promise<InstructorPayoutListResponse> {
        const params = new URLSearchParams({
            page: page.toString(),
            per_page: perPage.toString(),
        });

        if (instructorId) {
            params.append('instructor_id', instructorId.toString());
        }

        return this.fetchWithAuth(`/transactions/payouts?${params}`);
    }

    async getInstructorEarnings(
        instructorId: number,
        periodStart: string,
        periodEnd: string
    ): Promise<InstructorEarnings> {
        const params = new URLSearchParams({
            period_start: periodStart,
            period_end: periodEnd,
        });

        return this.fetchWithAuth(`/transactions/earnings/${instructorId}?${params}`);
    }

    async getDetailedInstructorEarnings(
        instructorId: number,
        periodStart: string,
        periodEnd: string
    ): Promise<any> {
        const params = new URLSearchParams({
            period_start: periodStart,
            period_end: periodEnd,
        });

        return this.fetchWithAuth(`/transactions/commission/earnings/${instructorId}?${params}`);
    }

    async getInstructorPerformance(
        instructorId: number,
        periodStart: string,
        periodEnd: string
    ): Promise<any> {
        const params = new URLSearchParams({
            period_start: periodStart,
            period_end: periodEnd,
        });

        return this.fetchWithAuth(`/transactions/commission/performance/${instructorId}?${params}`);
    }

    async createMonthlyPayouts(
        month: number,
        year: number,
        minimumPayout: number = 50
    ): Promise<any> {
        const params = new URLSearchParams({
            month: month.toString(),
            year: year.toString(),
            minimum_payout: minimumPayout.toString(),
        });

        return this.fetchWithAuth(`/transactions/commission/monthly-payouts?${params}`, {
            method: 'POST',
        });
    }

    // Financial analytics
    async getRevenueOverview(
        periodStart: string,
        periodEnd: string
    ): Promise<RevenueOverview> {
        const params = new URLSearchParams({
            period_start: periodStart,
            period_end: periodEnd,
        });

        return this.fetchWithAuth(`/transactions/analytics/revenue-overview?${params}`);
    }

    async getRevenueTrends(
        periodStart: string,
        periodEnd: string,
        interval: 'daily' | 'weekly' | 'monthly' = 'daily'
    ): Promise<{ trends: RevenueTrend[] }> {
        const params = new URLSearchParams({
            period_start: periodStart,
            period_end: periodEnd,
            interval,
        });

        return this.fetchWithAuth(`/transactions/analytics/revenue-trends?${params}`);
    }

    async getCourseRevenueAnalysis(
        periodStart: string,
        periodEnd: string,
        limit: number = 20
    ): Promise<{ courses: CourseRevenueAnalysis[] }> {
        const params = new URLSearchParams({
            period_start: periodStart,
            period_end: periodEnd,
            limit: limit.toString(),
        });

        return this.fetchWithAuth(`/transactions/analytics/course-revenue?${params}`);
    }

    async getInstructorRevenueAnalysis(
        periodStart: string,
        periodEnd: string,
        limit: number = 20
    ): Promise<{ instructors: InstructorRevenueAnalysis[] }> {
        const params = new URLSearchParams({
            period_start: periodStart,
            period_end: periodEnd,
            limit: limit.toString(),
        });

        return this.fetchWithAuth(`/transactions/analytics/instructor-revenue?${params}`);
    }

    async getPaymentMethodAnalysis(
        periodStart: string,
        periodEnd: string
    ): Promise<{ payment_methods: PaymentMethodAnalysis[] }> {
        const params = new URLSearchParams({
            period_start: periodStart,
            period_end: periodEnd,
        });

        return this.fetchWithAuth(`/transactions/analytics/payment-methods?${params}`);
    }

    async getRefundAnalysis(
        periodStart: string,
        periodEnd: string
    ): Promise<RefundAnalysis> {
        const params = new URLSearchParams({
            period_start: periodStart,
            period_end: periodEnd,
        });

        return this.fetchWithAuth(`/transactions/analytics/refunds?${params}`);
    }

    async getFinancialDashboard(
        periodStart: string,
        periodEnd: string
    ): Promise<FinancialDashboardData> {
        const params = new URLSearchParams({
            period_start: periodStart,
            period_end: periodEnd,
        });

        return this.fetchWithAuth(`/transactions/analytics/dashboard?${params}`);
    }

    async getPlatformCommissionSummary(
        periodStart: string,
        periodEnd: string
    ): Promise<any> {
        const params = new URLSearchParams({
            period_start: periodStart,
            period_end: periodEnd,
        });

        return this.fetchWithAuth(`/transactions/commission/platform-summary?${params}`);
    }

    // Tax reporting
    async getInstructor1099Data(
        instructorId: number,
        taxYear: number
    ): Promise<any> {
        const params = new URLSearchParams({
            tax_year: taxYear.toString(),
        });

        return this.fetchWithAuth(`/transactions/tax/1099/${instructorId}?${params}`);
    }

    async getPlatformTaxSummary(taxYear: number): Promise<any> {
        const params = new URLSearchParams({
            tax_year: taxYear.toString(),
        });

        return this.fetchWithAuth(`/transactions/tax/platform-summary?${params}`);
    }

    async getInstructorsRequiring1099(taxYear: number): Promise<any> {
        const params = new URLSearchParams({
            tax_year: taxYear.toString(),
        });

        return this.fetchWithAuth(`/transactions/tax/1099-required?${params}`);
    }

    async exportInstructorPayoutsCSV(
        taxYear: number,
        instructorId?: number
    ): Promise<Blob> {
        const params = new URLSearchParams({
            tax_year: taxYear.toString(),
        });

        if (instructorId) {
            params.append('instructor_id', instructorId.toString());
        }

        const token = localStorage.getItem('access_token');
        const response = await fetch(`${API_BASE_URL}/transactions/tax/export/payouts?${params}`, {
            headers: {
                ...(token && { Authorization: `Bearer ${token}` }),
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return response.blob();
    }

    async exportPlatformRevenueCSV(taxYear: number): Promise<Blob> {
        const params = new URLSearchParams({
            tax_year: taxYear.toString(),
        });

        const token = localStorage.getItem('access_token');
        const response = await fetch(`${API_BASE_URL}/transactions/tax/export/revenue?${params}`, {
            headers: {
                ...(token && { Authorization: `Bearer ${token}` }),
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return response.blob();
    }
}

export const transactionService = new TransactionService();