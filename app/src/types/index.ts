/**
 * TypeScript type definitions
 */

export interface User {
    _id: string;
    name: string;
    email: string;
    employeeId?: string;
    role: 'super_admin' | 'admin' | 'internal' | 'external';
    primaryOfficeId?: string | Office;  // Can be populated
    primaryOffice?: Office;
    dateOfBirth?: string;
    gender?: string;
    age?: number;
    phoneNumber?: string;
    phone?: string;  // Alternative field name
    status: 'active' | 'inactive' | 'pending';
    createdAt: string;
    updatedAt: string;
}

export interface Office {
    _id: string;
    name: string;
    address: string;  // Human-readable address
    location: {       // GeoJSON Point
        type: 'Point';
        coordinates: [number, number]; // [longitude, latitude]
    };
    targetHeadcount: number;
    currentEmployeeCount?: number;
    officeType?: 'main' | 'branch';
    isMainOffice?: boolean;
    officeId?: string;
    status?: 'active' | 'inactive';
    createdAt: string;
    updatedAt: string;
}

export interface Attendance {
    _id: string;
    userId: string;
    user?: User;
    officeId: string;
    office?: Office;
    date: string;
    location: {
        latitude: number;
        longitude: number;
    };
    createdAt: string;
    updatedAt: string;
}

export interface Goodie {
    _id: string;
    name: string;
    description?: string;
    quantity: number;
    officeId: string;
    office?: Office;
    createdAt: string;
    updatedAt: string;
}

export interface LocationRequest {
    _id: string;
    userId: string;
    user?: User;
    location: {
        latitude: number;
        longitude: number;
        address?: string;
    };
    status: 'pending' | 'approved' | 'denied';
    createdAt: string;
    updatedAt: string;
}

export interface DashboardStats {
    totalOffices: number;
    activeOffices: number;
    totalEmployees: number;
    attendanceToday: number;
    goodiesManaged: number;
    officeTargets: Array<{
        officeId: string;
        officeName: string;
        current: number;
        target: number;
        percentage: number;
    }>;
}

export interface AuthResponse {
    token: string;
    user: User;
}

export interface ApiError {
    message: string;
    errors?: Record<string, string[]>;
}
