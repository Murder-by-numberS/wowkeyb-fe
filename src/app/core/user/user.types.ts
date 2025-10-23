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
}
