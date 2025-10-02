/**
 * Transaction and financial types for the Learning Management System.
 */

export enum TransactionStatus {
    PENDING = "pending",
    COMPLETED = "completed",
    FAILED = "failed",
    CANCELLED = "cancelled",
    REFUNDED = "refunded"
}

export enum PaymentMethod {
    STRIPE = "stripe",
    PAYPAL = "paypal",
    BANK_TRANSFER = "bank_transfer",
    FREE = "free"
}

export interface Transaction {
    id: number;
    transaction_id: string;
    user_id: number;
    course_id?: number;
    amount: number;
    currency: string;
    status: TransactionStatus;
    payment_method: PaymentMethod;
    gateway_transaction_id?: string;
    refund_amount: number;
    refund_reason?: string;
    refunded_at?: string;
    description?: string;
    notes?: string;
    created_at: string;
    updated_at: string;
    completed_at?: string;
    net_amount: number;
}

export interface TransactionListResponse {
    transactions: Transaction[];
    total: number;
    page: number;
    per_page: number;
    total_pages: number;
}

export interface TransactionFilter {
    user_id?: number;
    course_id?: number;
    status?: TransactionStatus;
    payment_method?: PaymentMethod;
    start_date?: string;
    end_date?: string;
    min_amount?: number;
    max_amount?: number;
}

export interface PaymentIntentCreate {
    course_id: number;
    payment_method?: PaymentMethod;
    return_url?: string;
}

export interface PaymentIntentResponse {
    client_secret: string;
    transaction_id: string;
    amount: number;
    currency: string;
}

export interface RefundCreate {
    refund_amount: number;
    refund_reason: string;
}

export interface InstructorPayout {
    id: number;
    payout_id: string;
    instructor_id: number;
    amount: number;
    currency: string;
    commission_rate: number;
    period_start: string;
    period_end: string;
    status: TransactionStatus;
    payment_method?: string;
    external_payout_id?: string;
    created_at: string;
    updated_at: string;
    processed_at?: string;
}

export interface InstructorPayoutListResponse {
    payouts: InstructorPayout[];
    total: number;
    page: number;
    per_page: number;
    total_pages: number;
}

export interface InstructorEarnings {
    instructor_id: number;
    total_earnings: number;
    pending_earnings: number;
    paid_earnings: number;
    total_sales: number;
    commission_rate: number;
    period_start: string;
    period_end: string;
}

export interface RevenueOverview {
    period_start: string;
    period_end: string;
    total_transactions: number;
    gross_revenue: number;
    net_revenue: number;
    total_refunds: number;
    platform_revenue: number;
    total_instructor_payouts: number;
    avg_transaction_value: number;
    unique_customers: number;
    customer_ltv: number;
    refund_rate: number;
}

export interface RevenueTrend {
    period: string;
    transaction_count: number;
    gross_revenue: number;
    net_revenue: number;
    total_refunds: number;
}

export interface CourseRevenueAnalysis {
    course_id: number;
    course_title: string;
    course_price: number;
    instructor_name: string;
    sales_count: number;
    gross_revenue: number;
    net_revenue: number;
    total_refunds: number;
    refund_rate: number;
}

export interface InstructorRevenueAnalysis {
    instructor_id: number;
    instructor_name: string;
    course_count: number;
    sales_count: number;
    gross_revenue: number;
    net_revenue: number;
    total_refunds: number;
    estimated_commission: number;
    avg_revenue_per_course: number;
}

export interface PaymentMethodAnalysis {
    payment_method: string;
    transaction_count: number;
    total_revenue: number;
    avg_transaction_value: number;
    percentage_of_transactions: number;
    percentage_of_revenue: number;
}

export interface RefundAnalysis {
    period_start: string;
    period_end: string;
    total_transactions: number;
    total_refunded_transactions: number;
    refund_rate: number;
    total_refund_amount: number;
    refund_percentage_of_revenue: number;
    avg_refund_amount: number;
    refund_reasons: Record<string, { count: number; total_amount: number }>;
    top_refunded_courses: Array<{
        course_id: number;
        course_title: string;
        refund_count: number;
        refund_amount: number;
    }>;
}

export interface FinancialDashboardData {
    period_start: string;
    period_end: string;
    revenue_overview: RevenueOverview;
    revenue_trends: RevenueTrend[];
    top_courses: CourseRevenueAnalysis[];
    top_instructors: InstructorRevenueAnalysis[];
    payment_methods: PaymentMethodAnalysis[];
    pending_payouts: {
        count: number;
        total_amount: number;
    };
}