import axios from 'axios';

async function testApproval() {
    try {
        const baseURL = 'https://backend-nine-nu-46.vercel.app';

        // 1. Login as admin
        const loginRes = await axios.post(`${baseURL}/api/auth/login`, {
            email: 'admin@library.com',
            password: 'admin123'
        });
        const token = loginRes.data.token;
        console.log('Logged in successfully, got token.');

        // 2. Get users list
        const usersRes = await axios.get(`${baseURL}/api/admin/users`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        const demoUser = usersRes.data.find(u => u.email === 'faculty@library.com');
        if (!demoUser) {
            console.error('Could not find the demo user!');
            return;
        }
        console.log(`Found faculty user with ID: ${demoUser.id}`);

        // 3. Attempt to approve user
        try {
            console.log(`Attempting to update status for user ${demoUser.id}...`);
            const updateRes = await axios.put(`${baseURL}/api/admin/users/${demoUser.id}/status`,
                { status: 'active' },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            console.log('✅ Success:', updateRes.data);
        } catch (err) {
            console.error('❌ Update Request Failed!');
            console.error('HTTP Status:', err.response?.status);
            console.error('Error Data:', err.response?.data);
        }

    } catch (e) {
        console.error('Test script error:', e.message);
        if (e.response) console.error(e.response.data);
    }
}
testApproval();
