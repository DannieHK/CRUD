import { Router } from 'express';
import getConnection from '../Database/dbConnection.js';

const router = Router();

// Fetch all clients
router.get('/api/clients', async (req, res) => {
    const connection = await getConnection();
    try {
        const [rows] = await connection.execute('SELECT *, client_id AS id FROM clients');
        res.json(rows);
    } finally {
        connection.release();
    }
});

// Add a new client
router.post('/', async (req, res) => {
    const connection = await getConnection();
    try {
        const { client_ssn, first_name, last_name, client_email, client_phone, client_address, client_zipcode, client_city, client_start_date, client_reference, client_note } = req.body;

        const [result] = await connection.execute(`
            INSERT INTO clients 
            (client_ssn, first_name, last_name, client_email, client_phone, client_address, client_zipcode, client_city, client_start_date, client_reference, client_note) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [client_ssn, first_name, last_name, client_email, client_phone, client_address, client_zipcode, client_city, client_start_date, client_reference, client_note]);

        return res.status(201).json({ message: "Client added successfully", client_id: result.insertId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error adding client: ", error: error.message });
    } finally {
        connection.release();
    }
});

// Show a single client
router.get('/:clientId', async (req, res) => {
    const connection = await getConnection();
    try {
        const clientId = req.params.clientId;
        const [rows] = await connection.execute(`
            SELECT * FROM clients WHERE client_id = ?
        `, [clientId]);

        res.json(rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching client: ", error: error.message });
    }
});

// Update a client and associated company
router.put('/:clientId', async (req, res) => {
    const connection = await getConnection();
    // console.log('req.body:', req.body); // Log the request body = For edits
    try {
        const clientId = req.params.clientId;
        const {
            updatedSsn,
            updatedFirstName,
            updatedLastName,
            updatedEmail,
            updatedPhone,
            updatedAddress,
            updatedZip,
            updatedCity,
            updatedRef,
            updatedNote,
            updatedCompany // This object containing updated company data
        } = req.body;

        let updateClientQuery = 'UPDATE clients SET ';
        const updateClientFields = [];
        const updateClientValues = [];

        if (updatedFirstName !== undefined) {
            updateClientFields.push('first_name = ?');
            updateClientValues.push(updatedFirstName);
        }
        if (updatedLastName !== undefined) {
            updateClientFields.push('last_name = ?');
            updateClientValues.push(updatedLastName);
        }
        if (updatedEmail !== undefined) {
            updateClientFields.push('client_email = ?');
            updateClientValues.push(updatedEmail);
        }
        if (updatedPhone !== undefined) {
            updateClientFields.push('client_phone = ?');
            updateClientValues.push(updatedPhone);
        }
        if (updatedSsn !== undefined) {
            updateClientFields.push('client_ssn = ?');
            updateClientValues.push(updatedSsn);
        }
        if (updatedAddress !== undefined) {
            updateClientFields.push('client_address = ?');
            updateClientValues.push(updatedAddress);
        }
        if (updatedZip !== undefined) {
            updateClientFields.push('client_zipcode = ?');
            updateClientValues.push(updatedZip);
        }
        if (updatedCity !== undefined) {
            updateClientFields.push('client_city = ?');
            updateClientValues.push(updatedCity);
        }
        if (updatedRef !== undefined) {
            updateClientFields.push('client_reference = ?');
            updateClientValues.push(updatedRef);
        }
        if (updatedNote !== undefined) {
            updateClientFields.push('client_note = ?');
            updateClientValues.push(updatedNote);
        }

        if (updateClientFields.length > 0) {
            // Combine the update client fields into the query
            updateClientQuery += updateClientFields.join(', ');
            updateClientQuery += ' WHERE client_id = ?';
            updateClientValues.push(clientId);
            await connection.execute(updateClientQuery, updateClientValues);
        }

        // Add the client data to the associated company
        if (updatedCompany) {
            const {
                updatedCompanyName,
                updatedCompanyCvr,
                updatedCompanyMail,
                updatedCompanyPhone,
                updatedCompanyAddress,
                updatedCompanyZip,
                updatedCompanyCity,
                updatedCompanyAccountant,
                updatedCompanyNote
            } = updatedCompany;

            let updateCompanyQuery = 'UPDATE companies SET ';
            const updateCompanyFields = [];
            const updateCompanyValues = [];

            if (updatedCompanyCvr !== undefined) {
                updateCompanyFields.push('company_cvr = ?');
                updateCompanyValues.push(updatedCompanyCvr);
            }
            if (updatedCompanyName !== undefined) {
                updateCompanyFields.push('company_name = ?');
                updateCompanyValues.push(updatedCompanyName);
            }
            if (updatedCompanyMail !== undefined) {
                updateCompanyFields.push('company_email = ?');
                updateCompanyValues.push(updatedCompanyMail);
            }
            if (updatedCompanyPhone !== undefined) {
                updateCompanyFields.push('company_phone = ?');
                updateCompanyValues.push(updatedCompanyPhone);
            }
            if (updatedCompanyAddress !== undefined) {
                updateCompanyFields.push('company_address = ?');
                updateCompanyValues.push(updatedCompanyAddress);
            }
            if (updatedCompanyZip !== undefined) {
                updateCompanyFields.push('company_zipcode = ?');
                updateCompanyValues.push(updatedCompanyZip);
            }
            if (updatedCompanyCity !== undefined) {
                updateCompanyFields.push('company_city = ?');
                updateCompanyValues.push(updatedCompanyCity);
            }
            if (updatedCompanyAccountant !== undefined) {
                updateCompanyFields.push('company_accountant = ?');
                updateCompanyValues.push(updatedCompanyAccountant);
            }
            if (updatedCompanyNote !== undefined) {
                updateCompanyFields.push('company_note = ?');
                updateCompanyValues.push(updatedCompanyNote);
            }

            if (updateCompanyFields.length > 0) {
                // Combine the update company fields into the query with the client_id
                updateCompanyQuery += updateCompanyFields.join(', ');
                updateCompanyQuery += ' WHERE client_id = ?';
                
                updateCompanyValues.push(clientId); // Add the client ID to the company values array
                await connection.execute(updateCompanyQuery, updateCompanyValues);
            }
        }

        console.log('Client and associated company updated successfully: ', clientId);
        return res.json({ message: "Client and associated company updated successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error updating client and company: ", error: error.message });
    }
});

// Delete a client and associated company
router.delete('/:clientId', async (req, res) => {
    const connection = await getConnection();
    try {
        const clientId = req.params.clientId;

        await connection.execute(`
            DELETE FROM companies 
            WHERE client_id = ?
        `, [clientId]);

        await connection.execute(`
            DELETE FROM clients 
            WHERE client_id = ?
        `, [clientId]);

        return res.json({ message: "Client and associated companies deleted successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error deleting client: ", error: error.message });
    }
});

export default router;
