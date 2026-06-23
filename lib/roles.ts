// this is the code we used for static data before , which is now not useful as we adding roles and permission dynamically
// kept only for backward compatibility — new roles are created dynamically in DB
export const ROLES = {
    SUPER_ADMIN: "super-admin",
    ADMIN: "admin",
    STAFF: "staff",
    KITCHEN_MANAGER: "kitchen-manager",
    PAYMENT_MANAGER: "payment-manager",
    SUPPORT_STAFF: "support-staff",
    CUSTOMER: "customer",
} as const;
