export interface User {
    _id: string;
    name: string;
    email: string;
    username: string;
    avatar?: string;
    status?: string;
    passwordChangedAt?: Date | string;
    description?: string;
    favoriteClass?: string;
    access_level?: number;
}

// Admin access level constant (matches backend)
export const ADMIN_ACCESS_LEVEL = 9;
