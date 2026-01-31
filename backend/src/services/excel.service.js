/**
 * Excel Service
 * Handles Excel file parsing and generation for employee bulk import
 */
import XLSX from 'xlsx';
import AppError from '../utils/AppError.js';
import Office from '../models/office.model.js';
import User from '../models/user.model.js';

/**
 * Parse employee data from Excel file
 * @param {string} filePath - Path to the Excel file
 * @returns {Promise<Array>} - Array of employee objects
 */
export const parseEmployeeExcel = async (filePath, requestingUser) => {
    try {
        // Read the Excel file
        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Convert to JSON
        const data = XLSX.utils.sheet_to_json(worksheet);

        if (!data || data.length === 0) {
            throw new AppError('Excel file is empty', 400);
        }

        // Validate and transform data
        const employees = [];
        const errors = [];

        for (let i = 0; i < data.length; i++) {
            const row = data[i];
            const rowNumber = i + 2; // Excel row number (1-indexed + header row)

            try {
                const employee = await validateAndTransformRow(row, rowNumber, requestingUser);
                employees.push(employee);
            } catch (error) {
                errors.push({
                    row: rowNumber,
                    data: row,
                    error: error.message,
                });
            }
        }

        return { employees, errors };
    } catch (error) {
        if (error instanceof AppError) {
            throw error;
        }
        throw new AppError(`Failed to parse Excel file: ${error.message}`, 400);
    }
};

/**
 * Validate and transform a single row of employee data
 * @param {Object} row - Row data from Excel
 * @param {number} rowNumber - Row number for error reporting
 * @returns {Promise<Object>} - Validated employee object
 */
const validateAndTransformRow = async (row, rowNumber, requestingUser) => {
    const errors = [];

    // Validate required fields
    const requiredFields = ['name', 'age', 'gender', 'employee_id', 'employee_type'];

    // Add office_id as required for super_admin
    if (requestingUser.role === 'super_admin') {
        requiredFields.push('office_id');
    }

    for (const field of requiredFields) {
        if (!row[field] && row[field] !== 0) {
            errors.push(`Missing required field: ${field}`);
        }
    }

    if (errors.length > 0) {
        throw new Error(errors.join(', '));
    }

    // Validate name
    const name = String(row.name).trim();
    if (name.length === 0 || name.length > 100) {
        errors.push('Name must be between 1 and 100 characters');
    }

    // Validate age
    const age = parseInt(row.age);
    if (isNaN(age) || age < 18 || age > 100) {
        errors.push('Age must be a number between 18 and 100');
    }

    // Validate gender
    const gender = String(row.gender).trim().toLowerCase();
    const validGenders = ['male', 'female', 'other'];
    if (!validGenders.includes(gender)) {
        errors.push('Gender must be one of: male, female, other');
    }

    // Validate employee_id
    const employeeId = String(row.employee_id).trim();
    if (employeeId.length === 0) {
        errors.push('Employee ID cannot be empty');
    }

    // Check if employee_id (email) already exists
    const existingUser = await User.findOne({ email: `${employeeId}@company.com` });
    if (existingUser) {
        errors.push(`Employee with ID ${employeeId} already exists`);
    }

    // Validate employee_type
    const employeeType = String(row.employee_type).toLowerCase().trim();
    const validTypes = ['admin', 'internal', 'external'];
    if (!validTypes.includes(employeeType)) {
        errors.push('Employee type must be one of: admin, internal, external');
    }

    // Map employee_type to role
    const roleMapping = {
        'admin': 'admin',
        'internal': 'internal',
        'external': 'external'
    };
    const role = roleMapping[employeeType];

    // Handle office_id
    let primaryOfficeId;
    if (requestingUser.role === 'super_admin') {
        const office = await Office.findOne({ officeId: String(row.office_id).trim() });
        if (!office) {
            errors.push(`Office with ID ${row.office_id} not found`);
        } else {
            primaryOfficeId = office._id;
        }
    } else {
        // Admin uses their own office
        primaryOfficeId = requestingUser.primaryOfficeId || requestingUser.assignedOfficeId;
    }

    // Handle dob
    let dob;
    if (row.date_of_birth) {
        dob = new Date(row.date_of_birth);
        if (isNaN(dob.getTime())) {
            errors.push('Invalid date of birth format');
        }
    }

    if (errors.length > 0) {
        throw new Error(errors.join(', '));
    }

    // Return validated employee object
    return {
        name,
        age,
        gender,
        employeeId,
        email: `${employeeId}@company.com`, // Generate email from employee_id
        phone: `9999${String(Math.floor(Math.random() * 1000000)).padStart(6, '0')}`, // Generate random phone
        password: `Pass@${employeeId}`, // Default password
        role,
        primaryOfficeId,
        dob,
    };
};

/**
 * Generate Excel template for import
 * @param {Object} user - The requesting user
 * @param {string} type - 'employee' or 'goodies'
 * @returns {Buffer} - Excel file buffer
 */
export const generateExcelTemplate = (user, type = 'employee') => {
    const isSuperAdmin = user && user.role === 'super_admin';
    const workbook = XLSX.utils.book_new();

    if (type === 'goodies') {
        // --- Goodies Distribution Template ---
        const sampleData = [
            {
                employee_id: 'EMP001',
                employee_name: 'John Doe',
                ...(isSuperAdmin && { employee_office_id: 'OFFICE001' }),
            },
            {
                employee_id: '',
                employee_name: 'Unregistered Staff',
                ...(isSuperAdmin && { employee_office_id: 'OFFICE001' }),
            }
        ];

        const worksheet = XLSX.utils.json_to_sheet(sampleData);

        // Column widths
        const baseColumns = [
            { wch: 15 }, // employee_id
            { wch: 25 }, // employee_name
        ];
        if (isSuperAdmin) {
            baseColumns.push({ wch: 20 }); // employee_office_id
        }
        worksheet['!cols'] = baseColumns;

        XLSX.utils.book_append_sheet(workbook, worksheet, 'Recipients');

        // Instructions
        const instructions = [
            { Field: 'employee_id', Description: 'Employee ID for registered users. Leave empty for unregistered staff.', Required: 'No', Example: 'EMP001' },
            { Field: 'employee_name', Description: 'Name of the recipient.', Required: 'Yes', Example: 'John Doe' },
        ];
        if (isSuperAdmin) {
            instructions.push(
                { Field: 'employee_office_id', Description: 'Office ID of the recipient. Required for Super Admin if employee is unregistered.', Required: 'Conditional', Example: 'OFFICE001' }
            );
        }

        const instructionsSheet = XLSX.utils.json_to_sheet(instructions);
        instructionsSheet['!cols'] = [{ wch: 20 }, { wch: 50 }, { wch: 15 }, { wch: 15 }];
        XLSX.utils.book_append_sheet(workbook, instructionsSheet, 'Instructions');

    } else {
        // --- Employee Creation Template ---
        const sampleData = [
            {
                name: 'John Doe',
                age: 30,
                gender: 'male',
                employee_id: 'EMP001',
                employee_type: 'external',
                date_of_birth: '1994-01-01',
                ...(isSuperAdmin && { office_id: 'OFFICE001' }),
            },
            {
                name: 'Jane Smith',
                age: 28,
                gender: 'female',
                employee_id: 'EMP002',
                employee_type: 'internal',
                date_of_birth: '1996-05-15',
                ...(isSuperAdmin && { office_id: 'OFFICE001' }),
            },
        ];

        const worksheet = XLSX.utils.json_to_sheet(sampleData);

        const baseColumns = [
            { wch: 20 }, { wch: 10 }, { wch: 10 }, { wch: 15 }, { wch: 15 }, { wch: 15 },
        ];
        if (isSuperAdmin) {
            baseColumns.push({ wch: 15 });
        }
        worksheet['!cols'] = baseColumns;

        XLSX.utils.book_append_sheet(workbook, worksheet, 'Employees');

        const instructions = [
            { Field: 'name', Description: 'Full name', Required: 'Yes', Example: 'John Doe' },
            { Field: 'age', Description: 'Age (18-100)', Required: 'Yes', Example: '30' },
            { Field: 'gender', Description: 'Gender', Required: 'Yes', Example: 'male' },
            { Field: 'employee_id', Description: 'Unique ID', Required: 'Yes', Example: 'EMP001' },
            { Field: 'employee_type', Description: 'Role', Required: 'Yes', Example: 'external' },
            { Field: 'date_of_birth', Description: 'YYYY-MM-DD', Required: 'No', Example: '1994-01-01' },
        ];
        if (isSuperAdmin) {
            instructions.push(
                { Field: 'office_id', Description: 'Office ID (Super Admin only)', Required: 'Yes', Example: 'OFFICE001' }
            );
        }

        const instructionsSheet = XLSX.utils.json_to_sheet(instructions);
        instructionsSheet['!cols'] = [{ wch: 20 }, { wch: 50 }, { wch: 10 }, { wch: 20 }];
        XLSX.utils.book_append_sheet(workbook, instructionsSheet, 'Instructions');
    }

    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
};

/**
 * Generate error report Excel file
 * @param {Array} errors - Array of error objects
 * @returns {Buffer} - Excel file buffer
 */
export const generateErrorReport = (errors) => {
    const errorData = errors.map(err => ({
        Row: err.row,
        Data: JSON.stringify(err.data), // Simple string representation
        Error: err.error,
    }));

    const worksheet = XLSX.utils.json_to_sheet(errorData);
    worksheet['!cols'] = [{ wch: 8 }, { wch: 50 }, { wch: 50 }];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Errors');

    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
};

/**
 * Parse goodies distribution data from Excel file
 * @param {string} filePath - Path to the Excel file
 * @param {Object} requestingUser - The user uploading the file
 * @returns {Promise<Object>} - Distributions and errors
 */
export const parseGoodiesExcel = async (filePath, requestingUser) => {
    try {
        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet);

        if (!data || data.length === 0) {
            throw new AppError('Excel file is empty', 400);
        }

        const registeredUsers = [];
        const unregisteredRecipients = [];
        const errors = [];

        for (let i = 0; i < data.length; i++) {
            const row = data[i];
            const rowNumber = i + 2;

            try {
                let employeeId = String(row.employee_id || '').trim();
                let employeeName = String(row.employee_name || '').trim();
                const employeeOfficeId = String(row.employee_office_id || '').trim();

                // Helper to sanitize fields (allow alphanumeric, spaces, hyphen, dot, underscore, and @ for emails)
                // Removes potentially harmful chars like $, #, <, >, etc.
                const sanitize = (str) => str.replace(/[^a-zA-Z0-9\s.\-@_']/g, '');

                // We use the raw values for lookup to find matches if they exist in DB as-is
                // But we will use sanitized values when storing new data (unregistered)
                const sanitizedId = sanitize(employeeId);
                const sanitizedName = sanitize(employeeName);

                if (!employeeName && !employeeId) {
                    throw new Error('Row must have either Employee ID or Employee Name');
                }

                let officeId = null;
                // Determine office ID assignment logic
                if (requestingUser.role === 'super_admin') {
                    if (employeeOfficeId) {
                        const office = await Office.findOne({ officeId: employeeOfficeId });
                        if (!office) throw new Error(`Office ID ${employeeOfficeId} not found`);
                        officeId = office._id;
                    }
                    // For super admin, if explicit office ID is missing but it's a registered user, we'll get it from their profile later.
                    // If unregistered and no office ID, it's an error for super_admin.
                } else {
                    officeId = requestingUser.primaryOfficeId || requestingUser.assignedOfficeId;
                }

                // CASE 1: Registered User (has employee_id)
                if (employeeId) {
                    // Try to find by employeeId first (match exact DB value)
                    let user = await User.findOne({ employeeId: employeeId });

                    // If not found, try finding by email (if input looks like email)
                    if (!user && employeeId.includes('@')) {
                        user = await User.findOne({ email: employeeId.toLowerCase() });
                    }

                    // If not found, try finding by sanitized ID in case DB has clean ID but input has noise
                    if (!user && sanitizedId) {
                        user = await User.findOne({ employeeId: sanitizedId });
                    }

                    if (user) {
                        // User found - Check constraints

                        // For Admin/Internal: Must belong to their office
                        if (requestingUser.role !== 'super_admin') {
                            const adminOfficeId = (requestingUser.primaryOfficeId || requestingUser.assignedOfficeId)?.toString();
                            const userOfficeId = user.primaryOfficeId?.toString();

                            if (adminOfficeId && userOfficeId !== adminOfficeId) {
                                throw new Error(`Employee exists but belongs to a different office (${userOfficeId})`);
                            }
                        }

                        // User found and valid
                        registeredUsers.push({
                            userId: user._id,
                            officeId: user.primaryOfficeId || officeId, // Prioritize user's actual office
                            row: rowNumber
                        });
                        continue;
                    }
                }

                // CASE 2: Unregistered User (no employee_id OR invalid employee_id w/ name fallback)
                if (!sanitizedName) throw new Error('Valid Employee Name is required (special characters removed)');

                if (requestingUser.role === 'super_admin' && !officeId) {
                    throw new Error('Office ID is required for unregistered users (Super Admin)');
                }

                unregisteredRecipients.push({
                    name: sanitizedName, // Store sanitized name
                    employeeId: sanitizedId || undefined, // Store sanitized ID
                    officeId: officeId,
                    row: rowNumber
                });

            } catch (error) {
                errors.push({
                    row: rowNumber,
                    data: row,
                    error: error.message,
                });
            }
        }

        return { registeredUsers, unregisteredRecipients, errors };
    } catch (error) {
        if (error instanceof AppError) throw error;
        throw new AppError(`Failed to parse Excel file: ${error.message}`, 400);
    }
};

export default {
    parseEmployeeExcel,
    parseGoodiesExcel,
    generateExcelTemplate,
    generateErrorReport,
};
