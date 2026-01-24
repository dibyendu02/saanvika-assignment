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
 * Generate Excel template for employee import
 * @param {Object} user - The requesting user
 * @returns {Buffer} - Excel file buffer
 */
export const generateExcelTemplate = (user) => {
    const isSuperAdmin = user && user.role === 'super_admin';
    
    // Create sample data (conditionally include office_id)
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

    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(sampleData);

    // Set column widths (conditionally)
    const baseColumns = [
        { wch: 20 }, // name
        { wch: 10 }, // age
        { wch: 10 }, // gender
        { wch: 15 }, // employee_id
        { wch: 15 }, // employee_type
        { wch: 15 }, // date_of_birth
    ];
    
    if (isSuperAdmin) {
        baseColumns.push({ wch: 15 }); // office_id
    }
    
    worksheet['!cols'] = baseColumns;

    // Create workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Employees');

    // Create instructions sheet (conditionally include office_id)
    const baseInstructions = [
        { Field: 'name', Description: 'Full name of the employee', Required: 'Yes', Example: 'John Doe' },
        { Field: 'age', Description: 'Age of the employee (18-100)', Required: 'Yes', Example: '30' },
        { Field: 'gender', Description: 'Gender (male/female/other)', Required: 'Yes', Example: 'male' },
        { Field: 'employee_id', Description: 'Unique employee identifier', Required: 'Yes', Example: 'EMP001' },
        { Field: 'employee_type', Description: 'Employee type (admin/internal/external)', Required: 'Yes', Example: 'external' },
        { Field: 'date_of_birth', Description: 'Date of birth (YYYY-MM-DD)', Required: 'No', Example: '1994-01-01' },
    ];
    
    if (isSuperAdmin) {
        baseInstructions.push(
            { Field: 'office_id', Description: 'Office ID - Required only for Super Admin uploads', Required: 'Yes', Example: 'OFFICE001' }
        );
    }

    const instructionsSheet = XLSX.utils.json_to_sheet(baseInstructions);
    instructionsSheet['!cols'] = [
        { wch: 20 },
        { wch: 50 },
        { wch: 10 },
        { wch: 20 },
    ];
    XLSX.utils.book_append_sheet(workbook, instructionsSheet, 'Instructions');

    // Generate buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    return buffer;
};

/**
 * Generate error report Excel file
 * @param {Array} errors - Array of error objects
 * @returns {Buffer} - Excel file buffer
 */
export const generateErrorReport = (errors) => {
    const errorData = errors.map(err => ({
        Row: err.row,
        Name: err.data.name || '',
        Age: err.data.age || '',
        Gender: err.data.gender || '',
        Employee_ID: err.data.employee_id || '',
        Branch_Office: err.data.branch_office || '',
        Error: err.error,
    }));

    const worksheet = XLSX.utils.json_to_sheet(errorData);
    worksheet['!cols'] = [
        { wch: 8 },
        { wch: 20 },
        { wch: 8 },
        { wch: 10 },
        { wch: 15 },
        { wch: 25 },
        { wch: 50 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Errors');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    return buffer;
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

        const items = [];
        const errors = [];

        for (let i = 0; i < data.length; i++) {
            const row = data[i];
            const rowNumber = i + 2;

            try {
                // For goodies distribution, we need employee_id and optionally office_id
                const employeeId = String(row.employee_id || '').trim();
                if (!employeeId) throw new Error('Missing employee_id');

                const user = await User.findOne({ email: `${employeeId}@company.com` });
                if (!user) throw new Error(`Employee with ID ${employeeId} not found`);

                let office;
                if (requestingUser.role === 'super_admin') {
                    const officeIdStr = String(row.office_id || '').trim();
                    if (!officeIdStr) throw new Error('Missing office_id');
                    office = await Office.findOne({ officeId: officeIdStr });
                    if (!office) throw new Error(`Office with ID ${officeIdStr} not found`);
                } else {
                    office = await Office.findById(requestingUser.primaryOfficeId || requestingUser.assignedOfficeId);
                }

                if (!office) throw new Error('Office not found');

                items.push({
                    user,
                    office,
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

        return { items, errors };
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
